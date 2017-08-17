package main

import "log"
import "net/http"
import "io"
import "io/ioutil"
import "encoding/json"
import "math/rand"
import "time"
import "strings"


type TReservationId string;

type TReservation struct {
  Id TReservationId `json:"id"`;

  DateTime int64 `json:"date_time,omitempty"`;
  Duration int `json:"duration,omitempty"`;
  LocationId int `json:"location_id,omitempty"`;
  
  NumOfAdults int `json:"adult_count"`;
  NumOfChildren int `json:"children_count"`;
  MobilePhone string `json:"mobile_phone"`;
}

const NO_RESERVATION_ID = TReservationId("");

var Reservations = make(map[TReservationId]TReservation);


func ReservationHandler(w http.ResponseWriter, r *http.Request) {
  log.Println("Reservation Handler: request method=" + r.Method);
  
  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
  
  if (r.Method == http.MethodGet) {
    w.Header().Set("Content-Type", "text/plain")

    if (r.URL.RawQuery != "") {
      queryParams := parseQuery(r);
      
      queryReservationId, hasReservationId := queryParams["reservation_id"];
      queryLastName, hasLastName := queryParams["lastname"];
      if (hasReservationId && hasLastName) {
        reservationId := TReservationId(queryReservationId);
      
        reservation, hasReservation := GetReservation(reservationId, queryLastName);
        if (hasReservation) {
          w.WriteHeader(http.StatusOK);
          Reservations[reservationId] = reservation;

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
        reservationJson, _ := json.Marshal(Reservations[reservationId]);
        w.Write(reservationJson);
      }
    }
  } else if (r.Method == http.MethodPut) {
    reservationId := Sessions[TSessionId(sessionCookie.Value)];
    if (reservationId == NO_RESERVATION_ID) {
      reservationId = generateReservationId();
    }
  
    res := updateReservation(reservationId, r.Body);
    storedReservation, err := json.Marshal(res);
    if (err != nil) {
      w.WriteHeader(http.StatusInternalServerError);
      w.Write([]byte(err.Error()));
    } else {
      w.WriteHeader(http.StatusOK);
      w.Write(storedReservation);
    }
  }
}

func updateReservation(reservationId TReservationId, body io.ReadCloser) TReservation {
  bodyBuffer, _ := ioutil.ReadAll(body);
  body.Close();
  
  log.Println("Body:", string(bodyBuffer));
  
  res := TReservation{};
  err := json.Unmarshal(bodyBuffer, &res);
  if (err != nil) {
    log.Println("Incorrect request from the app: ", err);
  } else {
    res.Id = reservationId;
    Reservations[reservationId] = res;
    log.Println("Received object: ", res);
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


func parseQuery(r *http.Request) map[string]string {
  result := make(map[string]string);

  queryParts := strings.Split(r.URL.RawQuery, "&");
  for _, queryPart := range queryParts {
    queryNameValue := strings.Split(queryPart, "=");
    if (len(queryNameValue) != 2) {
      log.Println("Malformed query component: " + queryPart);
    }
    result[queryNameValue[0]] = queryNameValue[1];
  }

  return result;
}