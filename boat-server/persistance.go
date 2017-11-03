package main

import "log"
import "io/ioutil"
import "encoding/json"
import "time"
import "math/rand"


const DATABASE_FILE_NAME = "reservation_db.json";
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
type TSystemConfiguration struct {
  EmailConfiguration TEmailConfiguration `json:"email"`;
  SMSConfiguration TSMSConfiguration `json:"sms"`;
}


type TReservationId string;

type TReservation struct {
  Id TReservationId `json:"id"`;

  Timestamp int64 `json:"creation_timestamp,omitempty"`;

  Slot TBookingSlot `json:"slot,omitempty"`;
  LocationId string `json:"location_id"`;
  
  NumOfAdults int `json:"adult_count"`;
  NumOfChildren int `json:"children_count"`;
  
  Extras map[string]bool `json:"extras"`;

  DriversLicense string `json:"dl,omitempty"`;
  FirstName string `json:"first_name,omitempty"`;
  LastName string `json:"last_name,omitempty"`;
  Email string `json:"email,omitempty"`;
  MobilePhone string `json:"mobile_phone,omitempty"`;
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



const NO_RESERVATION_ID = TReservationId("");



var reservationMap TReservationMap;
var bookingConfiguration *TBookingConfiguration;
var systemConfiguration *TSystemConfiguration;
var listeners []TChangeListener;


func InitializePersistance(root string) {
  readSystemConfiguration(root);
  readBookingConfiguration(root);
  readReservationDatabase(root);
}


func GetReservation(reservationId TReservationId) *TReservation {
  return reservationMap[reservationId];
}

func RecoverReservation(reservationId TReservationId, lastName string) *TReservation {
  for resId, reservation := range reservationMap {
    if (reservationId == resId && reservation.LastName == lastName) {
      return reservation;
    }
  }

  return nil;
}

func GetAllReservations() TReservationMap {
  return reservationMap
}

func SaveReservation(reservation *TReservation) TReservationId {
  log.Println("Persistance: saving reservation " + reservation.Id);
  
  if (reservation.Id == NO_RESERVATION_ID) {
    reservation.Id = generateReservationId();
  }

  reservationMap[reservation.Id] = reservation;
  reservation.Timestamp = time.Now().Unix();
  
  notifyReservationUpdated(reservation);

  saveReservationDatabase();
  
  return reservation.Id;
}

func RemoveReservation(reservationId TReservationId) {
  log.Println("Persistance: removing reservation " + reservationId);

  reservation := *(reservationMap[reservationId]);
  
  delete(reservationMap, reservationId);
  
  notifyReservationRemoved(&reservation);
  
  saveReservationDatabase();
}

func GetSystemConfiguration() *TSystemConfiguration {
  return systemConfiguration;
}

func GetBookingConfiguration() *TBookingConfiguration {
  return bookingConfiguration;
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


func readSystemConfiguration(root string) {
  configurationByteArray, err := ioutil.ReadFile(root + "/" + SYSTEM_CONFIG_FILE_NAME);
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

func readBookingConfiguration(root string) {
  configurationByteArray, err := ioutil.ReadFile(root + "/" + BOOKING_CONFIG_FILE_NAME);
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


func readReservationDatabase(root string) {
  databaseByteArray, err := ioutil.ReadFile(root + "/" + DATABASE_FILE_NAME);
  if (err == nil) {
    err := json.Unmarshal(databaseByteArray, &reservationMap);
    if (err != nil) {
      log.Println("Persistance: failed to dersereialize the database - initializing", err);
    }
  } else {
    log.Println("Persistance: failed to read reservation database - initializing", err);
  }
  
  if (reservationMap == nil) {
    reservationMap = make(TReservationMap);
  } else {
    cleanObsoleteReservations();
  }
  
  log.Println("Persistance: reservation database is read");
}

func saveReservationDatabase() {
  cleanObsoleteReservations();

  databaseByteArray, err := json.MarshalIndent(reservationMap, "", "  ");
  if (err == nil) {
    err = ioutil.WriteFile(DATABASE_FILE_NAME, databaseByteArray, 0644);
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

  for reservationId, reservation := range reservationMap {
    if (reservation.PaymentStatus != PAYMENT_STATUS_PAYED) {
      if (reservation.Timestamp + EXPIRATION_TIMEOUT < currentMoment) {
        delete(reservationMap, reservationId);
      }
    }
  }
}


func generateReservationId() TReservationId {
  rand.Seed(time.Now().UnixNano());
  
  var bytes [10]byte;
  
  for i := 0; i < 10; i++ {
    bytes[i] = 65 + byte(rand.Intn(26));
  }
  
  return TReservationId(bytes[:]);
}

