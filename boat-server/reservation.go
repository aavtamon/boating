package main

import "log"
import "net/http"
import "io"
import "io/ioutil"
import "encoding/json"
import "fmt"
import "strings"

var temporaryReservations TReservationMap;


func ReservationHandler(w http.ResponseWriter, r *http.Request) {
  log.Println("Reservation Handler: request method=" + r.Method);
  
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

    fmt.Printf("Restoring reservation for %s and %s\n", queryParams["reservation_id"], queryParams["last_name"]);

    if (hasReservationId && hasLastName) {
      reservationId := TReservationId(queryReservationId);

      reservation := RecoverReservation(reservationId, queryLastName);
      if (reservation != nil) {
        storedReservation, err := json.Marshal(reservation);
        if (err != nil) {
          w.WriteHeader(http.StatusInternalServerError);
          w.Write([]byte(err.Error()));
        } else {
          w.WriteHeader(http.StatusOK);
          w.Write(storedReservation);

          sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
          Sessions[TSessionId(sessionCookie.Value)] = reservation.Id;
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
    reservationId := Sessions[TSessionId(sessionCookie.Value)];
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
      if (isBooked(reservation.Slot)) {
        w.WriteHeader(http.StatusConflict);
        return;
      }

      //TODO: Verify integrity first - not all fields can be modified by the user

      reservationId = SaveReservation(reservation);
    } else {
      //TODO: validate changed fields - reject those that cannot be changed
    }


    reservation = GetReservation(reservationId);
    if (reservation != nil) {
      storedReservation, _ := json.Marshal(reservation);
      w.WriteHeader(http.StatusOK);
      w.Write(storedReservation);

      sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
      Sessions[TSessionId(sessionCookie.Value)] = reservationId;
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

  reservationId := Sessions[TSessionId(sessionCookie.Value)];

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

  RemoveReservation(reservationId);

  Sessions[TSessionId(sessionCookie.Value)] = NO_RESERVATION_ID;

  w.WriteHeader(http.StatusOK);
}

func handleSendConfirmationEmail(w http.ResponseWriter, r *http.Request) {
  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
  
  reservationId := Sessions[TSessionId(sessionCookie.Value)];
  if (reservationId == NO_RESERVATION_ID) {
    w.WriteHeader(http.StatusNotFound);
    w.Write([]byte("No reservation selected"));

    return;
  }
fmt.Printf("SENDING CONFIRMATION TO: %s\n", r.URL.RawQuery)
  if (r.URL.RawQuery != "") {
    queryParams := parseQuery(r);

    queryEmail, hasEmail := queryParams["email"];
    
    if (!hasEmail) {
      w.WriteHeader(http.StatusBadRequest);
      w.Write([]byte("email address is not provided\n"))
      return;
    }
    
    reservation := GetReservation(TReservationId(reservationId));
    if (reservation == nil) {
      w.WriteHeader(http.StatusNotFound);
      w.Write([]byte("Reservartion not found\n"))
    } else {
      EmailReservationConfirmation(reservationId, queryEmail);
      w.WriteHeader(http.StatusOK);
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

