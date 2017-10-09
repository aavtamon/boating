package main

import "log"
import "io/ioutil"
import "encoding/json"
import "time"
import "math/rand"



const DATABASE_FILE_NAME = "/Users/aavtamonov/project/boat/reservation_db.json";
const SYSTEM_CONFIG_FILE_NAME = "/Users/aavtamonov/project/boat/boat-server/system_configuration.json";

const EXPIRATION_TIMEOUT = 60 * 10; //10 mins


type TSystemConfiguration struct {
  SchedulingBeginOffset int `json:"scheduling_begin_offset"`;
  SchedulingEndOffset int `json:"scheduling_end_offset"`;  
  Locations map[string]TRentalLocation `json:"locations"`;
}


type TReservationId string;

type TReservation struct {
  Id TReservationId `json:"id"`;

  Slot TBookingSlot `json:"slot,omitempty"`;
  LocationId string `json:"location_id"`;
  
  NumOfAdults int `json:"adult_count"`;
  NumOfChildren int `json:"children_count"`;
  MobilePhone string `json:"mobile_phone,omitempty"`;
  NoMobilePhone bool `json:"no_mobile_phone"`;
  
  FirstName string `json:"first_name,omitempty"`;
  LastName string `json:"last_name,omitempty"`;
  Email string `json:"email,omitempty"`;
  CellPhone string `json:"cell_phone,omitempty"`;
  AlternativePhone string `json:"alternative_phone,omitempty"`;
  StreetAddress string `json:"street_address,omitempty"`;
  AdditionalAddress string `json:"additional_address,omitempty"`;
  City string `json:"city,omitempty"`;
  State string `json:"state,omitempty"`;
  Zip string `json:"zip,omitempty"`;
  CreditCard string `json:"credit_card,omitempty"`;
  CreditCardCVC string `json:"credit_card_cvc,omitempty"`;
  CreditCardExpirationMonth string `json:"credit_card_expiration_month,omitempty"`;
  CreditCardExpirationYear string `json:"credit_card_expiration_year,omitempty"`;
  PaymentStatus string `json:"payment_status,omitempty"`;
  
  Timestamp int64;
  PaymentId string;
}

type TReservationMap map[TReservationId]*TReservation;


type TChangeListener interface {
  OnReservationChanged(reservation *TReservation);
  OnReservationRemoved(reservation *TReservation);
}



const NO_RESERVATION_ID = TReservationId("");



var reservationMap TReservationMap;
var systemSettings *TSystemConfiguration;
var listeners []TChangeListener;


func InitializePersistance() {
  readReservationDatabase();
}


func GetReservation(reservationId TReservationId) *TReservation {
  return reservationMap[reservationId];
}

func RecoverReservation(reservationId TReservationId, lastName string) *TReservation {
  for resId, reservation := range reservationMap {
    if (reservationId == resId && (*reservation).LastName == lastName) {
      return reservation;
    }
  }

  return nil;
}

func GetAllReservations() TReservationMap {
  return reservationMap
}

func SaveReservation(reservation *TReservation) TReservationId {
  log.Println("Persistance: saving reservation " + (*reservation).Id);
  
  if ((*reservation).Id == NO_RESERVATION_ID) {
    (*reservation).Id = generateReservationId();
  }

  reservationMap[(*reservation).Id] = reservation;
  (*reservation).Timestamp = time.Now().Unix();
  
  notifyReservationUpdated(reservation);

  saveReservationDatabase();
  
  return (*reservation).Id;
}

func RemoveReservation(reservationId TReservationId) {
  log.Println("Persistance: removing reservation " + reservationId);

  reservation := *(reservationMap[reservationId]);
  
  delete(reservationMap, reservationId);
  
  notifyReservationRemoved(&reservation);
  
  saveReservationDatabase();
}

func GetSystemSettings() *TSystemConfiguration {
  if (systemSettings == nil) {
    readSystemConfiguration();
  }
  
  return systemSettings;
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
  configurationByteArray, err := ioutil.ReadFile(SYSTEM_CONFIG_FILE_NAME);
  if (err == nil) {
    systemSettings = new (TSystemConfiguration);
    err := json.Unmarshal(configurationByteArray, systemSettings);
    if (err != nil) {
      log.Println("Persistance: failed to parse config file", err);
    } else {
      log.Println("Persistance: system config is read");
    }
  } else {
    log.Println("Persistance: failed to read system config", err);
  }
}


func readReservationDatabase() {
  databaseByteArray, err := ioutil.ReadFile(DATABASE_FILE_NAME);
  if (err == nil) {
    err := json.Unmarshal(databaseByteArray, &reservationMap);
    if (err != nil) {
      log.Println("Persistance: failed to dersereialize the database - initializing", err);
    }
  } else {
    log.Println("Persistance: failed to read reservation database - initializing", err);
  }
  
  if (reservationMap == nil) {
    reservationMap = make(map[TReservationId]*TReservation);
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
    if ((*reservation).PaymentStatus != PAYMENT_STATUS_PAYED) {
      if ((*reservation).Timestamp + EXPIRATION_TIMEOUT < currentMoment) {
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

