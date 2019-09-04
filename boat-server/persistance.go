package main

import "fmt"
import "io/ioutil"
import "encoding/json"
import "time"
import "math/rand"
import "sync"
import "strings"
import "os";
import "strconv";



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
  FirstName string `json:"first_name"`;
  LastName string `json:"last_name"`;
  DLState string `json:"dl_state"`;
  DLNumber string `json:"dl_number"`;
  PassDate int64 `json:"pass_date"`;
  ExpirationDate int64 `json:"expiration_date"`;
}

type TSafetyTestResults map[string]*TSafetyTestResult;


type TPersistancenceDatabase struct {
  SafetyTestResults TSafetyTestResults `json:"safety_test_results"`;
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
  Delay int `json:"delay,omitempty"`;
  LateFee float64 `json:"late_fee,omitempty"`;
  PromoCode string `json:"promo_code"`;
  Notes string `json:"notes"`;
  AdditionalDrivers []string `json:"additional_drivers,omitempty"`;
  
  Status TReservationStatus `json:"status,omitempty"`;
}

func (reservation TReservation) isActive() bool {
  return reservation.Status != RESERVATION_STATUS_CANCELLED && reservation.Status != RESERVATION_STATUS_COMPLETED && reservation.Status != RESERVATION_STATUS_ARCHIVED;
}

func (reservation TReservation) archive() {
  reservation.DLState = "";
  reservation.DLNumber = "";
  reservation.FirstName = "";
  reservation.LastName = "";
  reservation.Email = "";
  reservation.PrimaryPhone = "";
  reservation.AlternativePhone = "";
  reservation.AdditionalDrivers = nil;
  reservation.Status = RESERVATION_STATUS_ARCHIVED;
}


type TReservationMap map[TReservationId]*TReservation;

type TReservationSummary struct {
  Id TReservationId `json:"id"`;
  Slot TBookingSlot `json:"slot,omitempty"`;
}

type TRental struct {
  Slot TBookingSlot `json:"slot,omitempty"`;
  LocationId string `json:"location_id,omitempty"`;
  BoatId string `json:"boat_id,omitempty"`;
  LastName string `json:"last_name,omitempty"`;
  SafetyTestStatus bool `json:"safety_test_status"`;
  PaymentAmount float64 `json:"payment_amount,omitempty"`;
  Status TReservationStatus `json:"status,omitempty"`;
}

type TRentalStat struct {
  Rentals map[TReservationId]*TRental `json:"rentals,omitempty"`;
}

type TUsageStats struct {
  BoatUsageStats map[string]*TBoatUsageStat `json:"boat_usages,omitempty"`;
}

type TBoatUsageStat struct {
  LocationId string `json:"location_id,omitempty"`;
  BoatId string `json:"boat_id,omitempty"`;
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
const RESERVATION_STATUS_ARCHIVED TReservationStatus = "archived";



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
  
  schedulePeriodicCleanup();
}


func GetReservation(reservationId TReservationId) *TReservation {
  reservation := persistenceDb.Reservations[reservationId];
  
  if (reservation == nil) {
    return nil;
  }
  
  if (reservation.isActive()) {
    return reservation;
  }

  return nil;
}

func RecoverReservation(reservationId TReservationId, lastName string) *TReservation {
  for resId, reservation := range persistenceDb.Reservations {
    if (reservationId == resId && strings.EqualFold(reservation.LastName, lastName) && reservation.isActive()) {
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

func FindSafetyTestResults(reservation *TReservation) TSafetyTestResults {
  if (reservation == nil) {
    return nil;
  }

  results := make(TSafetyTestResults);
  
  primaryDlId := reservation.DLState + "-" + reservation.DLNumber;
  primaryResult := persistenceDb.SafetyTestResults[primaryDlId];
  if (primaryResult != nil && primaryResult.ExpirationDate > reservation.Slot.DateTime) {
    results[primaryDlId] = primaryResult;
  }
  
  for _,dlId := range reservation.AdditionalDrivers {
    additionalResult := persistenceDb.SafetyTestResults[dlId];
    if (additionalResult != nil && additionalResult.ExpirationDate > reservation.Slot.DateTime) {
      results[dlId] = additionalResult;
    }
  }
  
  return results;
}

func SaveSafetyTestResult(testResult *TSafetyTestResult) {
  dlId := testResult.DLState + "-" + testResult.DLNumber;
  fmt.Printf("Persistance: saving safety test result for dl %s\n", dlId);
  
  accessLock.Lock();
  persistenceDb.SafetyTestResults[dlId] = testResult;
  
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
  databaseByteArray, err := ioutil.ReadFile(RuntimeRoot + "/" + GetSystemConfiguration().PersistenceDb.PersistenceDbName);
  if (err == nil) {
    err := json.Unmarshal(databaseByteArray, &persistenceDb);
    if (err != nil) {
      fmt.Println("Persistance: failed to dersereialize reservation database - initializing: ", err);
    } else {
      fmt.Println("Persistance: reservation database is read");
    }
  } else {
    fmt.Println("Persistance: failed to read reservation database - initializing: ", err);
  }
  
  if (persistenceDb.Reservations == nil) {
    persistenceDb.Reservations = make(TReservationMap);
    persistenceDb.SafetyTestResults = make(TSafetyTestResults);
  }
  
  savePersistenceDatabase();
}

func savePersistenceDatabase() {
  cleanObsoleteReservations();
  cleanObsoleteSafetyTestResults();
  
  persistentDbPath := RuntimeRoot + "/" + GetSystemConfiguration().PersistenceDb.PersistenceDbName;
  
  // First, create a backup copy
  dbContent, err := ioutil.ReadFile(persistentDbPath);
  if (err == nil) {
    backupFile := GetSystemConfiguration().PersistenceDb.BackupPath + "/" + strconv.FormatInt(time.Now().UTC().Unix(), 10);
    err = ioutil.WriteFile(backupFile, dbContent, 0644);
    if (err != nil) {
      fmt.Println("Persistance: failed to create a backup copy: ", err);
    }
  } else {
    fmt.Println("Persistance: failed to read persistence db - skipping backup: ", err);
  }
  
  // Next, check if we need to remove the oldest file
  backupFiles, err := ioutil.ReadDir(GetSystemConfiguration().PersistenceDb.BackupPath);
  if (err != nil) {
    fmt.Println("Persistance: failed to enumerate backup files: ", err);
  } else {
    if (len(backupFiles) > GetSystemConfiguration().PersistenceDb.BackupQuantity) {
      //sort.Strings(backupFiles);
      err = os.Remove(GetSystemConfiguration().PersistenceDb.BackupPath + "/" + backupFiles[0].Name());
      if (err != nil) {
        fmt.Println("Persistance: failed to remove the olderst backup file: ", err);
      }
    }
  }
  
  // Finally, save to / overwrite the persistence db
  databaseByteArray, err := json.MarshalIndent(persistenceDb, "", "  ");
  if (err == nil) {
    err = ioutil.WriteFile(persistentDbPath, databaseByteArray, 0644);
    if (err != nil) {
      fmt.Println("Persistance: failed to save reservation database to file: ", err);
    } else {
      fmt.Println("Persistance: saving database");
    }
  } else {
    fmt.Println("Persistance: failed to serialize reservation database: ", err);
  }
}

func cleanObsoleteReservations() {
  currentMoment := time.Now().UTC().Unix();

  for reservationId, reservation := range persistenceDb.Reservations {
  
    // Boat owners reservations become completed automatically as they pass
    if (reservation.Status == RESERVATION_STATUS_BOOKED && reservation.OwnerAccountId != NO_OWNER_ACCOUNT_ID) {
      if (reservation.Slot.DateTime / int64(time.Second / time.Millisecond) + 60 * 60 * 24 < currentMoment) {
        reservation.Status = RESERVATION_STATUS_COMPLETED;
      }
    } else if (reservation.Status == RESERVATION_STATUS_CANCELLED) {
      expiration := systemConfiguration.BookingExpirationConfiguration.CancelledTimeout;
      if (reservation.Timestamp + expiration * 60 * 60 * 24 < currentMoment) {
        delete(persistenceDb.Reservations, reservationId);
      }
    } else if (reservation.Status == RESERVATION_STATUS_COMPLETED) {
      expiration := systemConfiguration.BookingExpirationConfiguration.CompletedTimeout;
      if (reservation.Timestamp + expiration * 60 * 60 * 24 < currentMoment) {
        reservation.archive();
      }
    } else if (reservation.Status == RESERVATION_STATUS_ARCHIVED) {
      expiration := systemConfiguration.BookingExpirationConfiguration.ArchivedTimeout;
      if (reservation.Timestamp + expiration * 60 * 60 * 24 < currentMoment) {
        delete(persistenceDb.Reservations, reservationId);  
      }
    }
  }
}

func cleanObsoleteSafetyTestResults() {
  currentMoment := time.Now().UTC().Unix();

  for dlId, testResult := range persistenceDb.SafetyTestResults {
    if (testResult.ExpirationDate + systemConfiguration.SafetyTestHoldTime * 60 * 60 * 24 < currentMoment) {
      delete(persistenceDb.SafetyTestResults, dlId);
    }
  }
}


func readOwnerAccountDatabase() {
  databaseByteArray, err := ioutil.ReadFile(RuntimeRoot + "/" + GetSystemConfiguration().PersistenceDb.AccountDbName);
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
  
  var sessionId string;
  var bytes [3]byte;
  
  for groupIndex := 0; groupIndex < 4; groupIndex++ {
    for i := 0; i < 3; i++ {
      bytes[i] = 48 + byte(rand.Intn(10));
    }
    
    if (groupIndex > 0) {
      sessionId += "-";
    }
    sessionId += string(bytes[:]);
  }
  
  return TReservationId(sessionId);
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

func GetOwnerReservationSummaries(ownerAccountId TOwnerAccountId) []*TReservationSummary {
  reservationSummaries := []*TReservationSummary{};

  if (ownerAccountId != NO_OWNER_ACCOUNT_ID) {
    for _, reservation := range persistenceDb.Reservations {
      if (reservation.OwnerAccountId == ownerAccountId && reservation.isActive()) {
        reservationSummaries = append(reservationSummaries, getReservationSummary(reservation));
      }
    }
  }

  return reservationSummaries;
}

func getReservationSummary(reservation *TReservation) *TReservationSummary {
  return &TReservationSummary{
    Id: reservation.Id,
    Slot: reservation.Slot,
  };
}


func GetOwnerRentalStat(accountId TOwnerAccountId) *TRentalStat {
  if (accountId == NO_OWNER_ACCOUNT_ID) {
    return nil;
  }

  account := ownerAccountMap[accountId];
  
  rentalStat := &TRentalStat{};
  rentalStat.Rentals = make(map[TReservationId]*TRental);
  
  for _, reservation := range persistenceDb.Reservations {
    if (reservation.Status == RESERVATION_STATUS_CANCELLED) {
      continue;
    }
  
    if (reservation.OwnerAccountId == NO_OWNER_ACCOUNT_ID) {
      boatIds, hasLocation := account.Locations[reservation.LocationId];
      if (hasLocation) {
        matches := false;
        if (len(boatIds.Boats) == 0 && account.Type == OWNER_ACCOUNT_TYPE_ADMIN) {
          matches = true;
        } else if (len(boatIds.Boats) > 0) {
          for _, boatId := range boatIds.Boats {
            if (boatId == reservation.BoatId) {
              matches = true;
              break;
            }
          }
        }

        if (matches) {
          rentalStat.Rentals[reservation.Id] = &TRental{};

          rentalStat.Rentals[reservation.Id].LocationId = reservation.LocationId;
          rentalStat.Rentals[reservation.Id].BoatId = reservation.BoatId;
          rentalStat.Rentals[reservation.Id].Slot = reservation.Slot;
          rentalStat.Rentals[reservation.Id].LastName = reservation.LastName;
          rentalStat.Rentals[reservation.Id].SafetyTestStatus = len(FindSafetyTestResults(reservation)) > 0;
          rentalStat.Rentals[reservation.Id].PaymentAmount = reservation.PaymentAmount;
          rentalStat.Rentals[reservation.Id].Status = reservation.Status;
        }
      }
    }
  }
  
  return rentalStat;
}


func GetUsageStats(accountId TOwnerAccountId) *TUsageStats {
  if (accountId == NO_OWNER_ACCOUNT_ID) {
    return nil;
  }

  account := ownerAccountMap[accountId];
  
  usageStat := &TUsageStats{};
  usageStat.BoatUsageStats = make(map[string]*TBoatUsageStat);
  
  for _, reservation := range persistenceDb.Reservations {
    if (reservation.Status == RESERVATION_STATUS_CANCELLED) {
      continue;
    }
  
    if (reservation.OwnerAccountId == NO_OWNER_ACCOUNT_ID) {
      boatIds, hasLocation := account.Locations[reservation.LocationId];
      if (hasLocation) {
        matches := false;
        if (len(boatIds.Boats) == 0 && account.Type == OWNER_ACCOUNT_TYPE_ADMIN) {
          matches = true;
        } else if (len(boatIds.Boats) > 0) {
          for _, boatId := range boatIds.Boats {
            if (boatId == reservation.BoatId) {
              matches = true;
              break;
            }
          }
        }

        if (matches) {
          usageId := reservation.LocationId + "-" + reservation.BoatId;
          boatUsageStat, hasStat := usageStat.BoatUsageStats[usageId];
          if (!hasStat) {
            boatUsageStat = &TBoatUsageStat{};
            boatUsageStat.LocationId = reservation.LocationId;
            boatUsageStat.BoatId = reservation.BoatId;
            
            usageStat.BoatUsageStats[usageId] = boatUsageStat;
          } else {
            // TODO
            //reservation.Slot
          }
        }
      }
    }
  }
  
  return usageStat;
}




func schedulePeriodicCleanup() {
  go func() {
    // Delay periodic action until 3am next day
    initialDelayMins := 60 - time.Now().Minute();
    initialDelayHours := 24 - time.Now().Hour() + 3;
    
    time.Sleep(time.Duration(initialDelayMins) * time.Minute + time.Duration(initialDelayHours) * time.Hour);
    fmt.Println("Persistance: periodic database adjustment. Starting 24-hour sequence now: ", time.Now().String());
    
    // Start action every 24 hours
    tickChannel := time.Tick(time.Duration(24) * time.Hour);
    for now := range tickChannel {
      fmt.Println("Persistance: periodic database saving at ", now.String());
      savePersistenceDatabase();
    }
  }();
}
