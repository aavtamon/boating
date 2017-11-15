package main

import "log"
import "io/ioutil"
import "encoding/json"
import "time"
import "math/rand"
import "sync"


const PERSISTENCE_DATABASE_FILE_NAME = "persistence_db.json";
const ACCOUNT_DATABASE_FILE_NAME = "account_db.json";
const SYSTEM_CONFIG_FILE_NAME = "system_configuration.json";
const BOOKING_CONFIG_FILE_NAME = "boat-server/booking_configuration.json";


const EXPIRATION_TIMEOUT = 60 * 10; //10 mins


type TBookingConfiguration struct {
  SchedulingBeginOffset int `json:"scheduling_begin_offset"`;
  SchedulingEndOffset int `json:"scheduling_end_offset"`;
  CancellationFees []TPricedRange `json:"cancellation_fees"`;
  Locations map[string]TRentalLocation `json:"locations"`;
}


type TEmailConfiguration struct {
  Enabled bool `json:"enabled"`;
  SourceAddress string `json:"source_address"`;
  MailServer string `json:"mail_server"`;
  ServerPort string `json:"server_port"`;
  ServerPassword string `json:"server_password"`;
}
type TSMSConfiguration struct {
  Enabled bool `json:"enabled"`;
  AccountSid string `json:"account_sid"`;
  AuthToken string `json:"auth_token"`;
  SourcePhone string `json:"source_phone"`;
}
type TPaymentConfiguration struct {
  Enabled bool `json:"enabled"`;
  SecretKey string `json:"secret_key"`;
}
type TSystemConfiguration struct {
  EmailConfiguration TEmailConfiguration `json:"email"`;
  SMSConfiguration TSMSConfiguration `json:"sms"`;
  PaymentConfiguration TPaymentConfiguration `json:"payment"`;
}


type TReservationId string;


type TReservation struct {
  Id TReservationId `json:"id"`;

  Timestamp int64 `json:"creation_timestamp,omitempty"`;
  
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
  PaymentStatus string `json:"payment_status,omitempty"`;
  PaymentAmount uint64 `json:"payment_amount,omitempty"`;
  RefundAmount uint64 `json:"refund_amount,omitempty"`;
  ChargeId string `json:"charge_id,omitempty"`;
  RefundId string `json:"refund_id,omitempty"`;
}

type TReservationMap map[TReservationId]*TReservation;


type TChangeListener interface {
  OnReservationChanged(reservation *TReservation);
  OnReservationRemoved(reservation *TReservation);
}


type TBoatIds struct {
  Boats []string `json:"boats,omitempty"`;
}

type TOwnerAccountId string;

type TOwnerAccount struct {
  Username string `json:"username,omitempty"`;
  Token string `json:"token,omitempty"`;
  
  FirstName string `json:"first_name,omitempty"`;
  LastName string `json:"last_name,omitempty"`;
  
  Locations map[string]TBoatIds `json:"locations,omitempty"`;
}

type TOwnerAccountMap map[TOwnerAccountId]*TOwnerAccount;


type TRental struct {
  Slots map[TReservationId]TBookingSlot `json:"slots,omitempty"`;
}

type TOwnerRentalsMap map[TOwnerAccountId]*TRental;

type TPersistancenceDatabase struct {
  Reservations TReservationMap `json:"reservations,omitempty"`;
  OwnerRentals TOwnerRentalsMap `json:"rentals,omitempty"`;
}




const NO_OWNER_ACCOUNT_ID = TOwnerAccountId("");
const NO_RESERVATION_ID = TReservationId("");



var bookingConfiguration *TBookingConfiguration;
var systemConfiguration *TSystemConfiguration;
var ownerAccountMap TOwnerAccountMap;
var persistenceDb TPersistancenceDatabase;
var listeners []TChangeListener;

var persistentRoot string;

var accessLock sync.Mutex;


func InitializePersistance(root string) {
  persistentRoot = root;

  readSystemConfiguration();
  readBookingConfiguration();
  readOwnerAccountDatabase();
  
  readPersistenceDatabase();
}


func GetReservation(reservationId TReservationId) *TReservation {
  return persistenceDb.Reservations[reservationId];
}

func RecoverReservation(reservationId TReservationId, lastName string) *TReservation {
  for resId, reservation := range persistenceDb.Reservations {
    if (reservationId == resId && reservation.LastName == lastName) {
      return reservation;
    }
  }

  return nil;
}

func GetAllReservations() TReservationMap {
  return persistenceDb.Reservations;
}

func SaveReservation(reservation *TReservation) TReservationId {
  log.Println("Persistance: saving reservation " + reservation.Id);
  
  if (reservation.Id == NO_RESERVATION_ID) {
    reservation.Id = generateReservationId();
  }

  reservation.Timestamp = time.Now().Unix();

  accessLock.Lock();
  persistenceDb.Reservations[reservation.Id] = reservation;
  
  
  // Update rentals
  accountId := findMatchingAccount(reservation.LocationId, reservation.BoatId);
  if (accountId != nil) {
    rental, hasRental := persistenceDb.OwnerRentals[*accountId];
    if (!hasRental) {
      rental = &TRental{};
      rental.Slots = make(map[TReservationId]TBookingSlot);
      persistenceDb.OwnerRentals[*accountId] = rental;
    }
    
    rental.Slots[reservation.Id] = reservation.Slot;
  }
  
  
  savePersistenceDatabase();
  accessLock.Unlock();
  
  notifyReservationUpdated(reservation);

  return reservation.Id;
}

func RemoveReservation(reservationId TReservationId) {
  log.Println("Persistance: removing reservation " + reservationId);
  
  if (persistenceDb.Reservations[reservationId] == nil) {
    return;
  }

  accessLock.Lock();
  reservation := *(persistenceDb.Reservations[reservationId]);

  delete(persistenceDb.Reservations, reservationId);
  
  
  // Update rentals
  accountId := findMatchingAccount(reservation.LocationId, reservation.BoatId);
  if (accountId != nil) {
    rental, hasRental := persistenceDb.OwnerRentals[*accountId];
    if (hasRental) {
      delete(rental.Slots, reservationId);
    }
  }


  savePersistenceDatabase();
  accessLock.Unlock();
  
  notifyReservationRemoved(&reservation);
}

func GetSystemConfiguration() *TSystemConfiguration {
  return systemConfiguration;
}

func GetBookingConfiguration() *TBookingConfiguration {
  return bookingConfiguration;
}

func GetOwnerAccount(accountId TOwnerAccountId) *TOwnerAccount {
  return ownerAccountMap[accountId];
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


func readSystemConfiguration() {
  configurationByteArray, err := ioutil.ReadFile(persistentRoot + "/" + SYSTEM_CONFIG_FILE_NAME);
  if (err == nil) {
    systemConfiguration = &TSystemConfiguration{};
    err := json.Unmarshal(configurationByteArray, systemConfiguration);
    if (err != nil) {
      log.Println("Persistance: failed to parse system config file", err);
    } else {
      log.Println("Persistance: system config is read");
    }
  } else {
    log.Println("Persistance: failed to read booking config", err);
  }
}

func readBookingConfiguration() {
  configurationByteArray, err := ioutil.ReadFile(persistentRoot + "/" + BOOKING_CONFIG_FILE_NAME);
  if (err == nil) {
    bookingConfiguration = &TBookingConfiguration{};
    err := json.Unmarshal(configurationByteArray, bookingConfiguration);
    if (err != nil) {
      log.Println("Persistance: failed to parse booking config file", err);
    } else {
      log.Println("Persistance: booking config is read");
    }
  } else {
    log.Println("Persistance: failed to read booking config", err);
  }
}


func readPersistenceDatabase() {
  databaseByteArray, err := ioutil.ReadFile(persistentRoot + "/" + PERSISTENCE_DATABASE_FILE_NAME);
  if (err == nil) {
    err := json.Unmarshal(databaseByteArray, &persistenceDb);
    if (err != nil) {
      log.Println("Persistance: failed to dersereialize reservation database - initializing", err);
    }
  } else {
    log.Println("Persistance: failed to read reservation database - initializing", err);
  }
  
  if (persistenceDb.Reservations == nil) {
    persistenceDb.Reservations = make(TReservationMap);
  } else {
    cleanObsoleteReservations();
  }

  if (persistenceDb.OwnerRentals == nil) {
    persistenceDb.OwnerRentals = make(TOwnerRentalsMap);
  }

  log.Println("Persistance: reservation database is read");
}

func savePersistenceDatabase() {
  cleanObsoleteReservations();

  databaseByteArray, err := json.MarshalIndent(persistenceDb, "", "  ");
  if (err == nil) {
    err = ioutil.WriteFile(persistentRoot + "/" + PERSISTENCE_DATABASE_FILE_NAME, databaseByteArray, 0644);
    if (err != nil) {
      log.Println("Persistance: failed to save reservation database to file", err);
    }
  } else {
    log.Println("Persistance: failed to serialize reservation database", err);
  }
  
  log.Println("Persistance: saving database");
}

func cleanObsoleteReservations() {
  currentMoment := time.Now().Unix();

  for reservationId, reservation := range persistenceDb.Reservations {
    if (reservation.PaymentStatus != PAYMENT_STATUS_PAYED) {
      if (reservation.Timestamp + EXPIRATION_TIMEOUT < currentMoment) {
        delete(persistenceDb.Reservations, reservationId);
      }
    }
  }
}


func readOwnerAccountDatabase() {
  databaseByteArray, err := ioutil.ReadFile(persistentRoot + "/" + ACCOUNT_DATABASE_FILE_NAME);
  if (err == nil) {
    err := json.Unmarshal(databaseByteArray, &ownerAccountMap);
    if (err != nil) {
      log.Println("Persistance: failed to dersereialize account database - initializing", err);
    }
  } else {
    log.Println("Persistance: failed to read account database - initializing", err);
  }
  
  if (ownerAccountMap == nil) {
    ownerAccountMap = make(TOwnerAccountMap);
  }
  
  log.Println("Persistance: account database is read");
}



func generateReservationId() TReservationId {
  rand.Seed(time.Now().UnixNano());
  
  var bytes [10]byte;
  
  for i := 0; i < 10; i++ {
    bytes[i] = 65 + byte(rand.Intn(26));
  }
  
  return TReservationId(bytes[:]);
}



func findMatchingAccount(locationId string, boatId string) *TOwnerAccountId {
  for accountId, account := range ownerAccountMap {
    boatIds, hasLocation := account.Locations[locationId];
    if (hasLocation) {
      for _, id := range boatIds.Boats {
        if (id == boatId) {
          return &accountId;
        }
      }
    }
  }
  
  return nil;
}
