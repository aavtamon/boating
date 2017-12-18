package main

import "log"
import "net/http"
import "encoding/json"
import "fmt"
import "io"
import "io/ioutil"


import "github.com/stripe/stripe-go"
import "github.com/stripe/stripe-go/charge"
import "github.com/stripe/stripe-go/refund"


type TPaymentRequest struct {
  ReservationId TReservationId `json:"reservation_id"`;
  PaymentToken string `json:"payment_token"`;
}



func PaymentHandler(w http.ResponseWriter, r *http.Request) {
  log.Println("Payment Handler: request method=" + r.Method);
  
  if (r.Method == http.MethodPut) {
    request := parsePaymentRequest(r.Body);
    if (request == nil) {
      w.WriteHeader(http.StatusInternalServerError);
      w.Write([]byte("Incorrect payment request format"));

      return;
    }

    reservation := GetReservation(request.ReservationId);
    if (reservation == nil) {
      w.WriteHeader(http.StatusNotFound);
      return;
    }

    if (payReservation(reservation, request)) {
      storedReservation, _ := json.Marshal(reservation);
      w.WriteHeader(http.StatusOK);
      w.Write(storedReservation);

      NotifyReservationPaid(request.ReservationId);
    } else {
      w.WriteHeader(http.StatusBadRequest);
    }
  } else if (r.Method == http.MethodDelete) {
    if (r.URL.RawQuery != "") {
      queryParams := parseQuery(r);
      
      queryReservationId, hasReservationId := queryParams["reservation_id"];
      if (hasReservationId) {
        reservation := GetReservation(TReservationId(queryReservationId));
        if (reservation == nil) {
          w.WriteHeader(http.StatusNotFound);
        } else {
          if (refundReservation(reservation)) {
            storedReservation, _ := json.Marshal(reservation);
            w.WriteHeader(http.StatusOK);
            w.Write(storedReservation);

            NotifyReservationRefunded(reservation.Id);
          } else {
            w.WriteHeader(http.StatusBadRequest);
          }
        }
      } else {
        w.WriteHeader(http.StatusBadRequest);
        w.Write([]byte("Resevration id is not provided"));
      }
    } else {
      w.WriteHeader(http.StatusBadRequest);
      w.Write([]byte("Resevration id is not provided"));
    }
  }
}



func payReservation(reservation *TReservation, request *TPaymentRequest) bool {
  fmt.Printf("Starting payment processing for reservation %s\n", request.ReservationId);

  paidAmount := reservation.Slot.Price; //TODO apply discounts in the future
  
  bookingConfiguration := GetBookingConfiguration();
  for extraId, included := range reservation.Extras {
    if (included) {
      paidAmount += bookingConfiguration.Locations[reservation.LocationId].Extras[extraId].Price;
    }
  }


  stripe.Key = GetSystemConfiguration().PaymentConfiguration.SecretKey;
  
  params := &stripe.ChargeParams {
    Amount: paidAmount * 100,
    Currency: "usd",
    Desc: "Boat reservation #" + string(request.ReservationId),
  }
  
  params.SetSource(request.PaymentToken);
  params.AddMeta("reservation_id", string(request.ReservationId));
  

  if (GetSystemConfiguration().PaymentConfiguration.Enabled) {
    charge, err := charge.New(params);
    
    if (err != nil) {
      fmt.Printf("Payment for reservation %s failed with error %s\n", request.ReservationId, err.Error());
      reservation.PaymentStatus = PAYMENT_STATUS_FAILED;
      SaveReservation(reservation);

      fmt.Printf("Payment processing for reservation %s failed\n", reservation.Id);

      return false;
    } else {
      reservation.ChargeId = charge.ID;
      reservation.PaymentStatus = PAYMENT_STATUS_PAYED;
      reservation.PaymentAmount = paidAmount;
      SaveReservation(reservation);

      fmt.Printf("Payment processing for reservation %s is complete successfully\n", reservation.Id);

      return true;
    }
  } else {
    fmt.Println("Payments turned off - payment will not be processed thru the payent portal");
    
      reservation.ChargeId = "fake charge";
      reservation.PaymentStatus = PAYMENT_STATUS_PAYED;
      reservation.PaymentAmount = paidAmount;
      SaveReservation(reservation);

      return true;
  }
}

func refundReservation(reservation *TReservation) bool {
  fmt.Printf("Starting refund processing for reservation %s\n", reservation.Id);

  stripe.Key = GetSystemConfiguration().PaymentConfiguration.SecretKey;
  
  params := &stripe.RefundParams {
    Charge: reservation.ChargeId,
  }
  
  cancellationFee := getNonRefundableFee(reservation);
  fmt.Printf("Non refundable fees = %d\n", cancellationFee);
  
  refundAmount := reservation.PaymentAmount;
  
  if (cancellationFee > 0) {
    refundAmount = (reservation.PaymentAmount - cancellationFee);
    if (refundAmount < 0) {
      refundAmount = 0;
    }
    params.Amount = refundAmount * 100;
  }
  
  if (GetSystemConfiguration().PaymentConfiguration.Enabled) {
    refund, err := refund.New(params);

    if (err != nil) {
      fmt.Printf("Refund for reservation %s failed with error %s\n", reservation.Id, err.Error());
      SaveReservation(reservation);

      fmt.Printf("Refund processing for reservation %s failed\n", reservation.Id);

      return false;
    } else {
      reservation.RefundId = refund.ID;
      reservation.PaymentStatus = PAYMENT_STATUS_REFUNDED;
      reservation.RefundAmount = refundAmount;
      SaveReservation(reservation);

      fmt.Printf("Refund processing for reservation %s is complete successfully\n", reservation.Id);

      return true;
    }
  } else {
    fmt.Println("Payments turned off - refund will not be processed thru the payent portal");
    
    reservation.RefundId = "fake refund";
    reservation.PaymentStatus = PAYMENT_STATUS_REFUNDED;
    reservation.RefundAmount = refundAmount;
    SaveReservation(reservation);
    
    return true;
  }
}


func parsePaymentRequest(body io.ReadCloser) *TPaymentRequest {
  bodyBuffer, _ := ioutil.ReadAll(body);
  body.Close();
  
  request := &TPaymentRequest{};
  err := json.Unmarshal(bodyBuffer, request);
  if (err != nil) {
    log.Println("Incorrect payment request from the app: ", err);
    return nil;
  }
  
  return request;
}


func getNonRefundableFee(reservation *TReservation) uint64 {
  bookingSettings := GetBookingSettings();
  bookingConfiguration := GetBookingConfiguration();
  
  timeLeftToTrip := (reservation.Slot.DateTime - bookingSettings.CurrentDate) / 1000 / 60 / 60;
  
  for _, fee := range bookingConfiguration.CancellationFees {
    if (fee.RangeMin <= timeLeftToTrip && timeLeftToTrip < fee.RangeMax) {
      return fee.Price;
    }
  }
  
  return 0;
}
