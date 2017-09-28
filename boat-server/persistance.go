package main

import "log"
import "io/ioutil"
import "encoding/json"
import "time"


const DATABASE_FILE_NAME = "/Users/aavtamonov/project/boat/reservation_db.json";

const EXPIRATION_TIMEOUT = 60 * 10; //10 mins

var reservationMap TReservationMap;

func GetReservation(reservationId TReservationId, lastName string) *TReservation {
  if (reservationMap == nil) {
    readReservationDatabase();
  }

  for resId, reservation := range reservationMap {
    if (reservationId == resId && (*reservation).LastName == lastName) {
      return reservation;
    }
  }

  return nil;
}

func SaveReservation(reservation *TReservation) {
  if (reservationMap == nil) {
    readReservationDatabase();
  }

  log.Println("Persistance: saving reservation " + (*reservation).Id);

  reservationMap[(*reservation).Id] = reservation;
  (*reservation).Timestamp = time.Now().Unix();
  
  cleanObsoleteReservations();

  saveReservationDatabase();
}


func readReservationDatabase() {
  databaseByteArray, err := ioutil.ReadFile(DATABASE_FILE_NAME);
  if (err == nil) {
    err := json.Unmarshal(databaseByteArray, &reservationMap);
    if (err != nil) {
      log.Println("Persistance: failed to dersereialize the datavase - initializing", err);
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