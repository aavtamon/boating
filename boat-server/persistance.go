package main

import "log"
import "io/ioutil"
import "encoding/json"

const DATABASE_FILE_NAME = "/Users/aavtamonov/project/boat/reservation_db.json";

var reservationMap map[TReservationId]TReservation = nil;

func GetReservation(reservationId TReservationId, lastName string) (TReservation, bool) {
  return TReservation{}, true;
}

func SaveReservation(reservation *TReservation) {
  if (reservationMap == nil) {
    readReservationDatabase();
  }

  reservationMap[reservation.Id] = *reservation;

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
    reservationMap = make(map[TReservationId]TReservation);
  }
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
}