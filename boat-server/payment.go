package main

import "log"
import "net/http"
import "encoding/json"
//import "strings"
import "sync"
//import "time"
import "fmt"

import "github.com/stripe/stripe-go"
import "github.com/stripe/stripe-go/charge"


const PAYMENT_STATUS_PAYED = "payed";
const PAYMENT_STATUS_FAILED = "failed";

const PAYMENT_SECRET_KEY = "sk_test_7Fr3JQHkcFnbcTcYB17BizNM";

var waitLocks = make(map[TReservationId]*sync.WaitGroup);


func PaymentHandler(w http.ResponseWriter, r *http.Request) {
  log.Println("Payment Handler: request method=" + r.Method);
  
  if (r.Method == http.MethodPut) {
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

    if ((*reservation).PaymentStatus == PAYMENT_STATUS_PAYED) {
      sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
      Sessions[TSessionId(sessionCookie.Value)] = reservationId;


      storedReservation, _ := json.Marshal(res);
      w.WriteHeader(http.StatusOK);
      w.Write(storedReservation);

      EmailReservationConfirmation(reservationId);
    } else if ((*reservation).PaymentStatus == PAYMENT_STATUS_FAILED) {
      RemoveReservation(reservationId);
      w.WriteHeader(http.StatusBadRequest);
    }
  }
}


func payReservation(reservationId TReservationId) {
  fmt.Printf("Starting payment processing for reservation %s\n", reservationId);

  stripe.Key = PAYMENT_SECRET_KEY;
  
  reservation := GetReservation(reservationId);

  params := &stripe.ChargeParams{
    Amount: reservation.Slot.Price * 100,
    Currency: "usd",
    Desc: "Boat reservation #" + string(reservationId),
  }
  
  params.SetSource(reservation.PaymentToken);
  params.AddMeta("reservation_id", string(reservationId));
  
  charge, err := charge.New(params);
  
  if (err != nil) {
    fmt.Printf("Payment for reservation %s failed with error %s\n", reservationId, err.Error());
    reservation.PaymentStatus = PAYMENT_STATUS_FAILED;
  } else {
    reservation.PaymentId = charge.ID;
    reservation.PaymentStatus = PAYMENT_STATUS_PAYED;
  }
}









/*
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
    (*res).PaymentStatus = PAYMENT_STATUS_PAYED;
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
*/