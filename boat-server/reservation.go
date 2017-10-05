package main

import "log"
import "net/http"
import "io"
import "io/ioutil"
import "encoding/json"


var temporaryReservations TReservationMap;


func ReservationHandler(w http.ResponseWriter, r *http.Request) {
  log.Println("Reservation Handler: request method=" + r.Method);
  
  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
  
  if (r.Method == http.MethodGet) {
    w.Header().Set("Content-Type", "text/plain")

    if (r.URL.RawQuery != "") {
      queryParams := parseQuery(r);
      
      queryReservationId, hasReservationId := queryParams["reservation_id"];
      queryLastName, hasLastName := queryParams["last_name"];
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
            Sessions[TSessionId(sessionCookie.Value)] = (*reservation).Id;
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
  } else if (r.Method == http.MethodPut) {
    reservationId := Sessions[TSessionId(sessionCookie.Value)];
    if (reservationId == NO_RESERVATION_ID) {
      w.WriteHeader(http.StatusNotFound);
      w.Write([]byte("No reservation id"));
      
      return;
    }
  
    res := parseReservation(r.Body);
    if (res != nil) {
      SaveReservation(res);
      
      storedReservation, _ := json.Marshal(res);
      w.WriteHeader(http.StatusOK);
      w.Write(storedReservation);
    } else {
      w.WriteHeader(http.StatusInternalServerError);
      w.Write([]byte("Incorrect reservation format"));
    }
  } else if (r.Method == http.MethodDelete) {
    reservationId := Sessions[TSessionId(sessionCookie.Value)];
    if (reservationId == NO_RESERVATION_ID) {
      w.WriteHeader(http.StatusNotFound);
      w.Write([]byte("No reservation selected"));
      
      return;
    }
    
    RemoveReservation(reservationId);
    
    sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
    Sessions[TSessionId(sessionCookie.Value)] = NO_RESERVATION_ID;
    
    w.WriteHeader(http.StatusOK);
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

