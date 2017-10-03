package main

import "log"
import "net/http"
import "io"
import "io/ioutil"
import "encoding/json"
import "math/rand"
import "time"


const NO_RESERVATION_ID = TReservationId("");


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
      reservationId = generateReservationId();
      
      sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
      Sessions[TSessionId(sessionCookie.Value)] = reservationId;
    }
  
    res := updateReservation(reservationId, r.Body);
    SaveReservation(res);
    
    storedReservation, err := json.Marshal(res);
    if (err != nil) {
      w.WriteHeader(http.StatusInternalServerError);
      w.Write([]byte(err.Error()));
    } else {
      w.WriteHeader(http.StatusOK);
      w.Write(storedReservation);
    }
  } else if (r.Method == http.MethodDelete) {
    reservationId := Sessions[TSessionId(sessionCookie.Value)];
    if (reservationId == NO_RESERVATION_ID) {
      w.WriteHeader(http.StatusNotFound);
      w.Write([]byte("No reservation selected"));
      
      return;
    }
    
    RemoveReservation(reservationId);
    
    w.WriteHeader(http.StatusOK);
  }
}

func updateReservation(reservationId TReservationId, body io.ReadCloser) *TReservation {
  bodyBuffer, _ := ioutil.ReadAll(body);
  body.Close();
  
  log.Println("Body:", string(bodyBuffer));
  
  res := &TReservation{};
  err := json.Unmarshal(bodyBuffer, res);
  if (err != nil) {
    log.Println("Incorrect request from the app: ", err);
  } else {
    (*res).Id = reservationId;
    log.Println("Received object: ", (*res));
  }
  
  log.Println("*****");
  
  return res;
}



func generateReservationId() TReservationId {
  rand.Seed(time.Now().UnixNano());
  
  var bytes [10]byte;
  
  for i := 0; i < 10; i++ {
    bytes[i] = 65 + byte(rand.Intn(26));
  }
  
  return TReservationId(bytes[:]);
}


