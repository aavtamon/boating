package main

import "log"
import "net/http"
import "io"
import "io/ioutil"
import "encoding/json"
import "fmt"
import "strings"



func ReservationHandler(w http.ResponseWriter, r *http.Request) {
  if (r.Method == http.MethodGet) {
    handleGetReservation(w, r);
  } else if (r.Method == http.MethodPut) {
    if (strings.HasSuffix(r.URL.Path, "/email")) {
      handleSendConfirmationEmail(w, r);
    } else {
      handleSaveReservation(w, r);
    }
  } else if (r.Method == http.MethodDelete) {
    handleDeleteReservation(w, r);
  }
}


func handleGetReservation(w http.ResponseWriter, r *http.Request) {
  w.Header().Set("Content-Type", "text/plain");
  
  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);

  if (r.URL.RawQuery != "") {
    queryParams := parseQuery(r);

    queryReservationId, hasReservationId := queryParams["reservation_id"];
    queryLastName, hasLastName := queryParams["last_name"];

    fmt.Printf("Restoring reservation %s for %s\n", queryParams["reservation_id"], queryParams["last_name"]);

    if (hasReservationId) {
      reservationId := TReservationId(queryReservationId);

      var reservation *TReservation = nil;
      
      if (hasLastName) {
        reservation = RecoverReservation(reservationId, queryLastName);
      } else {
        accountId := *Sessions[TSessionId(sessionCookie.Value)].AccountId;
        if (accountId != NO_OWNER_ACCOUNT_ID) {
          reservation = RecoverOwnerReservation(reservationId, accountId);
        }
      }
      
      if (reservation != nil) {
        storedReservation, err := json.Marshal(reservation);
        if (err != nil) {
          w.WriteHeader(http.StatusInternalServerError);
          w.Write([]byte(err.Error()));
        } else {
          w.WriteHeader(http.StatusOK);
          w.Write(storedReservation);

          sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
          *Sessions[TSessionId(sessionCookie.Value)].ReservationId = reservation.Id;
        }
      } else {
        w.WriteHeader(http.StatusNotFound);
        w.Write([]byte("No such reservation\n"))
      }
    } else {
      w.WriteHeader(http.StatusBadRequest);
      w.Write([]byte("Reservation Id and Last Name must be provided\n"))
    }
  } else {
    reservationId := *Sessions[TSessionId(sessionCookie.Value)].ReservationId;
    w.WriteHeader(http.StatusOK);
    if (reservationId == NO_RESERVATION_ID) {
      w.Write([]byte("{}\n"))
    } else {
      reservationJson, _ := json.Marshal(GetReservation(reservationId));
      w.Write(reservationJson);
    }
  }
}

func handleSaveReservation(w http.ResponseWriter, r *http.Request) {
  reservation := parseReservation(r.Body);
  reservationId := reservation.Id;

  if (reservation != nil) {
    existingReservation := GetReservation(reservationId);
    if (existingReservation == nil) {
    
      if (isBooked(reservation.LocationId, reservation.BoatId, reservation.Slot)) {
        w.WriteHeader(http.StatusConflict);
        return;
      }

      //TODO: Verify integrity first - not all fields can be modified by the user

      reservation.Status = RESERVATION_STATUS_BOOKED;
      reservationId = SaveReservation(reservation);
      existingReservation = GetReservation(reservationId);
      
      NotifyReservationBooked(reservationId);
    } else {
      // TODO: may need better validation
      
      reservationChanged := false;
      if (existingReservation.Status != reservation.Status && (reservation.Status == RESERVATION_STATUS_BOOKED || reservation.Status == RESERVATION_STATUS_DEPOSITED || reservation.Status == RESERVATION_STATUS_ACCIDENT || reservation.Status == RESERVATION_STATUS_COMPLETED)) {
        existingReservation.Status = reservation.Status;
        reservationChanged = true;
      }
      if (existingReservation.FuelUsage != reservation.FuelUsage && (reservation.FuelUsage > 0 && reservation.FuelUsage <= 100)) {
      
        existingReservation.FuelUsage = reservation.FuelUsage;
        reservationChanged = true;
      }
      
      if (reservationChanged) {
        SaveReservation(existingReservation);
        NotifyReservationUpdated(reservationId);
      }
    }


    
    if (existingReservation != nil) {
      storedReservation, _ := json.Marshal(existingReservation);
      w.WriteHeader(http.StatusOK);
      w.Write(storedReservation);

      sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
      *Sessions[TSessionId(sessionCookie.Value)].ReservationId = reservationId;
    } else {
      w.WriteHeader(http.StatusInternalServerError);
      w.Write([]byte("Failed to store reservation"));
    }
  } else {
    w.WriteHeader(http.StatusInternalServerError);
    w.Write([]byte("Incorrect reservation format"));
  }  
}

func handleDeleteReservation(w http.ResponseWriter, r *http.Request) {
  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);

  reservationId := *Sessions[TSessionId(sessionCookie.Value)].ReservationId;

  if (r.URL.RawQuery != "") {
    queryParams := parseQuery(r);

    queryReservationId, hasReservationId := queryParams["reservation_id"];
    if (hasReservationId) {
      reservationId = TReservationId(queryReservationId);
    }
  }

  fmt.Printf("Removing reservation %s\n", reservationId);

  if (reservationId == NO_RESERVATION_ID) {
    w.WriteHeader(http.StatusNotFound);
    w.Write([]byte("No reservation selected"));

    return;
  }

  //RemoveReservation(reservationId);
  reservation := GetReservation(reservationId);
  reservation.Status = RESERVATION_STATUS_CANCELLED;
  SaveReservation(reservation);
  
  NotifyReservationCancelled(reservationId);

  *Sessions[TSessionId(sessionCookie.Value)].ReservationId = NO_RESERVATION_ID;

  w.WriteHeader(http.StatusOK);
}

func handleSendConfirmationEmail(w http.ResponseWriter, r *http.Request) {
  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
  
  reservationId := *Sessions[TSessionId(sessionCookie.Value)].ReservationId;
  if (reservationId == NO_RESERVATION_ID) {
    w.WriteHeader(http.StatusNotFound);
    w.Write([]byte("No reservation selected"));

    return;
  }

  if (r.URL.RawQuery != "") {
    queryParams := parseQuery(r);

    reservation := GetReservation(TReservationId(reservationId));
    if (reservation == nil) {
      w.WriteHeader(http.StatusNotFound);
      w.Write([]byte("Reservartion not found\n"))
    } else {
      email, hasEmail := queryParams["email"];
      if (!hasEmail) {
        email = reservation.Email;
      }
    
      if (EmailReservationConfirmation(reservationId, email)) {
        w.WriteHeader(http.StatusOK);
      } else {
        w.WriteHeader(http.StatusInternalServerError);
      }
    }
  } else {
    w.WriteHeader(http.StatusBadRequest);
    w.Write([]byte("Email address is not provided\n"))
  }
}


func parseReservation(body io.ReadCloser) *TReservation {
  bodyBuffer, _ := ioutil.ReadAll(body);
  body.Close();
  
  res := &TReservation{};
  err := json.Unmarshal(bodyBuffer, res);
  if (err != nil) {
    log.Println("Incorrect request from the app: ", err);
    return nil;
  }
  
  return res;
}

