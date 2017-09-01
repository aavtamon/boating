package main

import "log"
import "net/http"
import "encoding/json"



func PaymentHandler(w http.ResponseWriter, r *http.Request) {
  log.Println("Payment Handler: request method=" + r.Method);
  
  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
  
  if (r.Method == http.MethodPut) {
    reservationId := Sessions[TSessionId(sessionCookie.Value)];
    if (reservationId == NO_RESERVATION_ID) {
      reservationId = generateReservationId();
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

func payReservation(reservationId TReservationId) TReservation {
  res := Reservations[reservationId];
  res.Payed = true;
  
  EmailReservationConfirmation(reservationId);
  
  return res;
}
