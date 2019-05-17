package main

import "fmt"
import "io/ioutil"
import "encoding/json"
import "time"
import "math/rand"
import "sync"
import "strings"


const PERSISTENCE_DATABASE_FILE_NAME = "persistence_db.json";
const ACCOUNT_DATABASE_FILE_NAME = "account_db.json";




type TBoatIds struct {
  Boats []string `json:"boats,omitempty"`;
}

type TOwnerAccountId string;
type TOwnerAccountType string;

type TOwnerAccount struct {
  Id TOwnerAccountId `json:"id,omitempty"`;
  Type TOwnerAccountType `json:"type,omitempty"`;

  Username string `json:"username,omitempty"`;
  Token string `json:"token,omitempty"`;
  
  FirstName string `json:"first_name,omitempty"`;
  LastName string `json:"last_name,omitempty"`;
  Email string `json:"email,omitempty"`;
  PrimaryPhone string `json:"primary_phone,omitempty"`;
  
  Locations map[string]TBoatIds `json:"locations,omitempty"`;
}

type TOwnerAccountMap map[TOwnerAccountId]*TOwnerAccount;


type TSafetyTestResult struct {
  SuiteId TSafetySuiteId `json:"suite_id"`;
  Score int `json:"score"`;
  LastName string `json:"last_name"`;
  PassDate int64 `json:"pass_date"`;
  ExpirationDate int64 `json:"expiration_date"`;
}

type TSafetyTestResultMap map[string]*TSafetyTestResult;


type TPersistancenceDatabase struct {
  SafetyTestResults TSafetyTestResultMap `json:"safety_test_results"`;
  Reservations TReservationMap `json:"reservations"`;
}


type TReservationId string;
type TReservationStatus string;
type TPaymentStatus string;

type TReservation struct {
  Id TReservationId `json:"id"`;
  
  OwnerAccountId TOwnerAccountId `json:"owner_account_id"`;

  Timestamp int64 `json:"modification_timestamp,omitempty"`;
  
  LocationId string `json:"location_id"`;
  BoatId string `json:"boat_id"`;

  Slot TBookingSlot `json:"slot,omitempty"`;
  PickupLocationId string `json:"pickup_location_id"`;
  
  NumOfAdults int `json:"adult_count"`;
  NumOfChildren int `json:"children_count"`;
  
  Extras map[string]bool `json:"extras"`;

  DLState string `json:"dl_state,omitempty"`;
  DLNumber string `json:"dl_number,omitempty"`;
  FirstName string `json:"first_name,omitempty"`;
  LastName string `json:"last_name,omitempty"`;
  Email string `json:"email,omitempty"`;
  PrimaryPhone string `json:"primary_phone,omitempty"`;
  AlternativePhone string `json:"alternative_phone,omitempty"`;
  PaymentStatus TPaymentStatus `json:"payment_status,omitempty"`;
  PaymentAmount float64 `json:"payment_amount,omitempty"`;
  RefundAmount float64 `json:"refund_amount,omitempty"`;
  ChargeId string;
  RefundId string;
  DepositChargeId string;
  DepositRefundId string;
  DepositAmount float64 `json:"deposit_amount,omitempty"`;
  DepositStatus TPaymentStatus `json:"deposit_status,omitempty"`;
  FuelUsage int `json:"fuel_usage,omitempty"`;
  FuelCharge float64 `json:"fuel_charge,omitempty"`;
  PromoCode string `json:"promo_code"`;
  
  Status TReservationStatus `json:"status,omitempty"`;
}

type TReservationMap map[TReservationId]*TReservation;

type TReservationSummary struct {
  Id TReservationId `json:"id"`;
  Slot TBookingSlot `json:"slot,omitempty"`;
}


type TChangeListener interface {
  OnReservationChanged(reservation *TReservation);
  OnReservationRemoved(reservation *TReservation);
}



const RESERVATION_STATUS_BOOKED TReservationStatus = "booked";
const RESERVATION_STATUS_CANCELLED TReservationStatus = "cancelled";
const RESERVATION_STATUS_DEPOSITED TReservationStatus = "deposited";
const RESERVATION_STATUS_COMPLETED TReservationStatus = "completed";
const RESERVATION_STATUS_ACCIDENT TReservationStatus = "accident";



const PAYMENT_STATUS_PAYED TPaymentStatus = "payed";
const PAYMENT_STATUS_FAILED TPaymentStatus = "failed";
const PAYMENT_STATUS_REFUNDED TPaymentStatus = "refunded";


const OWNER_ACCOUNT_TYPE_BOATOWNER TOwnerAccountType = "boat_owner";
const OWNER_ACCOUNT_TYPE_ADMIN TOwnerAccountType = "admin";




const NO_OWNER_ACCOUNT_ID = TOwnerAccountId("");
const NO_RESERVATION_ID = TReservationId("");



var ownerAccountMap TOwnerAccountMap;
var persistenceDb TPersistancenceDatabase;
var listeners []TChangeListener;

var accessLock sync.Mutex;


func InitializePersistance() {
  readOwnerAccountDatabase();
  readPersistenceDatabase();
  
  InitializeBookings();
}


func GetReservation(reservationId TReservationId) *TReservation {
  reservation := persistenceDb.Reservations[reservationId];
  
  if (reservation == nil) {
    return nil;
  }
  
  if (reservation.Status != RESERVATION_STATUS_CANCELLED && reservation.Status != RESERVATION_STATUS_COMPLETED) {
    return reservation;
  }

  return nil;
}

func RecoverReservation(reservationId TReservationId, lastName string) *TReservation {
  for resId, reservation := range persistenceDb.Reservations {
    if (reservationId == resId && strings.EqualFold(reservation.LastName, lastName) &&
        reservation.Status != RESERVATION_STATUS_CANCELLED && reservation.Status != RESERVATION_STATUS_COMPLETED) {
      return reservation;
    }
  }

  return nil;
}

func RecoverOwnerReservation(reservationId TReservationId, ownerAccountId TOwnerAccountId) *TReservation {
  for resId, reservation := range persistenceDb.Reservations {
    if (reservationId == resId) {
      if (reservation.OwnerAccountId == ownerAccountId && reservation.Status == RESERVATION_STATUS_BOOKED) {
        return reservation;
      }

      account := GetOwnerAccount(ownerAccountId);
      if (account != nil && account.Type == OWNER_ACCOUNT_TYPE_ADMIN) {
        return reservation;
      }
    }
  }

  return nil;
}

func GetAllReservations() TReservationMap {
  return persistenceDb.Reservations;
}

func GetOwnerReservationSummaries(ownerAccountId TOwnerAccountId) []*TReservationSummary {
  reservationSummaries := []*TReservationSummary{};

  if (ownerAccountId != NO_OWNER_ACCOUNT_ID) {
    for _, reservation := range persistenceDb.Reservations {
      if (reservation.OwnerAccountId == ownerAccountId && reservation.Status != RESERVATION_STATUS_CANCELLED && reservation.Status != RESERVATION_STATUS_COMPLETED) {
        reservationSummaries = append(reservationSummaries, getReservationSummary(reservation));
      }
    }
  }

  return reservationSummaries;
}


func SaveReservation(reservation *TReservation) TReservationId {
  fmt.Printf("Persistance: saving reservation %s\n", reservation.Id);
  
  if (reservation.Id == NO_RESERVATION_ID) {
    reservation.Id = generateReservationId();
  }

  reservation.Timestamp = time.Now().UTC().Unix();

  accessLock.Lock();
  persistenceDb.Reservations[reservation.Id] = reservation;
  
    
  savePersistenceDatabase();
  accessLock.Unlock();
  
  notifyReservationUpdated(reservation);

  return reservation.Id;
}

func RemoveReservation(reservationId TReservationId) {
  fmt.Printf("Persistance: removing reservation %s\n", reservationId);
  
  if (persistenceDb.Reservations[reservationId] == nil) {
    return;
  }

  accessLock.Lock();
  reservation := *(persistenceDb.Reservations[reservationId]);

  delete(persistenceDb.Reservations, reservationId);
  
  savePersistenceDatabase();
  accessLock.Unlock();
  
  notifyReservationRemoved(&reservation);
}

func FindSafetyTestResult(reservation *TReservation) *TSafetyTestResult {
  if (reservation == nil) {
    return nil;
  }

  result := persistenceDb.SafetyTestResults[reservation.DLNumber];
  
  if (result != nil && result.LastName == reservation.LastName && result.ExpirationDate > time.Now().UTC().Unix()) {
    return result;
  }
  
  return nil;
}

func SaveSafetyTestResult(dlNumber string, testResult *TSafetyTestResult) {
  fmt.Printf("Persistance: saving safety test result for dl %s\n", dlNumber);
  
  accessLock.Lock();
  persistenceDb.SafetyTestResults[dlNumber] = testResult;
  
  savePersistenceDatabase();
  accessLock.Unlock();
}



func GetOwnerAccount(accountId TOwnerAccountId) *TOwnerAccount {
  ownerAccount := ownerAccountMap[accountId];
  if (ownerAccount == nil) {
    return nil;
  }
  
  ownerAccount.Id = accountId;
  
  return ownerAccount;
}

func AddReservationListener(listener TChangeListener) {
  listeners = append(listeners, listener);
}




func notifyReservationUpdated(reservation *TReservation) {
  for _, listener := range listeners {
    listener.OnReservationChanged(reservation);
  }
}

func notifyReservationRemoved(reservation *TReservation) {
  for _, listener := range listeners {
    listener.OnReservationRemoved(reservation);
  }
}




func readPersistenceDatabase() {
  databaseByteArray, err := ioutil.ReadFile(RuntimeRoot + "/" + PERSISTENCE_DATABASE_FILE_NAME);
  if (err == nil) {
    err := json.Unmarshal(databaseByteArray, &persistenceDb);
    if (err != nil) {
      fmt.Println("Persistance: failed to dersereialize reservation database - initializing", err);
    } else {
      fmt.Println("Persistance: reservation database is read");
    }
  } else {
    fmt.Println("Persistance: failed to read reservation database - initializing", err);
  }
  
  if (persistenceDb.Reservations == nil) {
    persistenceDb.Reservations = make(TReservationMap);
    persistenceDb.SafetyTestResults = make(TSafetyTestResultMap);
  } else {
    cleanObsoleteReservations();
    cleanObsoleteSafetyTestResults();
  }
}

func savePersistenceDatabase() {
  cleanObsoleteReservations();
  cleanObsoleteSafetyTestResults();

  databaseByteArray, err := json.MarshalIndent(persistenceDb, "", "  ");
  if (err == nil) {
    err = ioutil.WriteFile(RuntimeRoot + "/" + PERSISTENCE_DATABASE_FILE_NAME, databaseByteArray, 0644);
    if (err != nil) {
      fmt.Println("Persistance: failed to save reservation database to file", err);
    } else {
      fmt.Println("Persistance: saving database");
    }
  } else {
    fmt.Println("Persistance: failed to serialize reservation database", err);
  }
}

func cleanObsoleteReservations() {
  currentMoment := time.Now().UTC().Unix();

  for reservationId, reservation := range persistenceDb.Reservations {
    expiration := int64(0);
    if (reservation.Status == RESERVATION_STATUS_CANCELLED) {
      expiration = systemConfiguration.BookingExpirationConfiguration.CancelledTimeout;
    } else if (reservation.Status == RESERVATION_STATUS_COMPLETED) {
      expiration = systemConfiguration.BookingExpirationConfiguration.CompletedTimeout;
    }

    if (expiration > 0) {
      if (reservation.Timestamp + expiration * 60 * 60 * 24 < currentMoment) {
        delete(persistenceDb.Reservations, reservationId);
      }
    }
  }
}

func cleanObsoleteSafetyTestResults() {
  currentMoment := time.Now().UTC().Unix();

  for dl, testResult := range persistenceDb.SafetyTestResults {
    if (testResult.ExpirationDate + systemConfiguration.SafetyTestHoldTime * 60 * 60 * 24 < currentMoment) {
      delete(persistenceDb.SafetyTestResults, dl);
    }
  }
}


func readOwnerAccountDatabase() {
  databaseByteArray, err := ioutil.ReadFile(RuntimeRoot + "/" + ACCOUNT_DATABASE_FILE_NAME);
  if (err == nil) {
    err := json.Unmarshal(databaseByteArray, &ownerAccountMap);
    if (err != nil) {
      fmt.Println("Persistance: failed to dersereialize account database - initializing", err);
    } else {
      fmt.Println("Persistance: account database is read");    
    }
  } else {
    fmt.Println("Persistance: failed to read account database - initializing", err);
  }
  
  if (ownerAccountMap == nil) {
    ownerAccountMap = make(TOwnerAccountMap);
  }
}



func generateReservationId() TReservationId {
  rand.Seed(time.Now().UTC().UnixNano());
  
  var bytes [10]byte;
  
  for i := 0; i < 10; i++ {
    bytes[i] = 65 + byte(rand.Intn(26));
  }
  
  return TReservationId(bytes[:]);
}



func findMatchingAccounts(locationId string, boatId string) []*TOwnerAccount {
  result := []*TOwnerAccount{};

  for _, account := range ownerAccountMap {
    boatIds, hasLocation := account.Locations[locationId];
    if (hasLocation) {
      if (len(boatIds.Boats) == 0 && account.Type == OWNER_ACCOUNT_TYPE_ADMIN) {
        result = append(result, account);
      } else {
        for _, id := range boatIds.Boats {
          if (id == boatId) {
            result = append(result, account);
          }
        }
      }
    } else if (account.Type == OWNER_ACCOUNT_TYPE_ADMIN) {
      result = append(result, account);
    }
  }
  
  return result;
}


func getReservationSummary(reservation *TReservation) *TReservationSummary {
  return &TReservationSummary{
    Id: reservation.Id,
    Slot: reservation.Slot,
  };
}