package main

import "log"
import "net/http"
import "encoding/json"
import "strings"
import "sync"
import "time"


const PAYMENT_STATUS_PAYED = "payed";



var waitLocks = make(map[TReservationId]*sync.WaitGroup);


func PaymentHandler(w http.ResponseWriter, r *http.Request) {
  log.Println("Payment Handler: request method=" + r.Method);
  
  if (r.Method == http.MethodPut) {
    if (strings.HasSuffix(r.URL.Path, "confirmation")) {
      handlePaymentConfirmation(NO_RESERVATION_ID);
      
      w.WriteHeader(http.StatusOK);
    } else {
      res := parseReservation(r.Body);
      if (res == nil) {
        w.WriteHeader(http.StatusInternalServerError);
        w.Write([]byte("Incorrect reservation format"));
        
        return;
      }


      if (isBooked(res.Slot)) {
        w.WriteHeader(http.StatusConflict);
        return;
      }

      reservationId := SaveReservation(res);
      payReservation(reservationId);
      
      reservation := GetReservation(reservationId);
      
      if ((*reservation).PaymentStatus == "payed") {
        sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
        Sessions[TSessionId(sessionCookie.Value)] = reservationId;
        
        
        storedReservation, _ := json.Marshal(res);
        w.WriteHeader(http.StatusOK);
        w.Write(storedReservation);
        
        EmailReservationConfirmation(reservationId);
      } else if ((*reservation).PaymentStatus == "declined") {
        RemoveReservation(reservationId);
        w.WriteHeader(http.StatusBadRequest);
      }
    }
  } else if (r.Method == http.MethodGet) {
    // This is a temporary code
    if (strings.HasSuffix(r.URL.Path, "confirmation")) {
      queryParams := parseQuery(r);
      
      queryReservationId, hasReservationId := queryParams["reservation_id"];
      if (!hasReservationId) {
        w.WriteHeader(http.StatusBadRequest);
        w.Write([]byte("Reservation id is not provided"));
        
        return;
      }
      
      handlePaymentConfirmation(TReservationId(queryReservationId));
    }
  }
}

func payReservation(reservationId TReservationId) {
  wg := sync.WaitGroup{};
  waitLocks[reservationId] = &wg;
  wg.Add(1);
  
  // Temporary
  go offlinePayment(reservationId);
  log.Println("Payment: entering payment confirmation block for reservation: " + reservationId);
  
  wg.Wait();
  
  log.Println("Payment: leaving payment confirmation block for reservation: " + reservationId);
}

func handlePaymentConfirmation(reservationId TReservationId) {
  wg, hasReservation := waitLocks[reservationId];
  if (hasReservation) {
    res := GetReservation(reservationId);
    (*res).PaymentStatus = "payed";
    SaveReservation(res);
    
    log.Println("Payment: confirming payment for reservation: " + reservationId);
    
    delete(waitLocks, reservationId);
    (*wg).Done();
  } else {
    log.Println("Error in payment handler - unknown reservation: " + reservationId);
  }
}

func offlinePayment(reservationId TReservationId) {
  time.Sleep(10 * time.Second);
  handlePaymentConfirmation(reservationId);
}
