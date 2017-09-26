package main

import "log"
import "net/http"
import "encoding/json"
import "strings"
import "sync"

var waitLocks = make(map[TReservationId]sync.WaitGroup);


func PaymentHandler(w http.ResponseWriter, r *http.Request) {
  log.Println("Payment Handler: request method=" + r.Method);
  
  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
  
  if (r.Method == http.MethodPut) {
    if (strings.HasSuffix(r.URL.Path, "confirmation")) {
      handlePaymentConfirmation(NO_RESERVATION_ID);
    } else {
      reservationId := Sessions[TSessionId(sessionCookie.Value)];
      if (reservationId == NO_RESERVATION_ID) {
        w.WriteHeader(http.StatusInternalServerError);
        w.Write([]byte("Unknown reservation"));
        return;
      }

      res := payReservation(reservationId);
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
}

func payReservation(reservationId TReservationId) TReservation {
  wg := sync.WaitGroup{};
  waitLocks[reservationId] = wg
  wg.Add(1);
  wg.Wait();
  
  res := Reservations[reservationId];
  
  EmailReservationConfirmation(reservationId);
  
  return res;
}

func handlePaymentConfirmation(reservationId TReservationId) {
  wg, hasReservation := waitLocks[reservationId];
  if (hasReservation) {
    res := Reservations[reservationId];
    res.PaymentStatus = "payed";
    wg.Done();
  } else {
    log.Println("Error in payment handler - unknown reservation: " + reservationId);
  }
}
