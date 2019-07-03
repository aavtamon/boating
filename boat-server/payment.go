package main

import "log"
import "net/http"
import "encoding/json"
import "fmt"
import "strings"
import "io"
import "io/ioutil"
import "time"
import "strconv"


import "github.com/stripe/stripe-go"
import "github.com/stripe/stripe-go/charge"
import "github.com/stripe/stripe-go/refund"


type TPaymentRequest struct {
  ReservationId TReservationId `json:"reservation_id"`;
  PaymentToken string `json:"payment_token"`;
}



func PaymentHandler(w http.ResponseWriter, r *http.Request) {
  sessionId := GetSessionId(r);
  if (sessionId == NO_SESSION_ID) {
    w.WriteHeader(http.StatusUnauthorized);
    w.Write([]byte("Invalid session id\n"));
    return;
  }

  if (r.Method == http.MethodGet) {
    if (strings.HasSuffix(r.URL.Path, "/promo/")) {
      if (r.URL.RawQuery != "") {
        queryParams := parseQuery(r);

        promoCode, hasPromoCode := queryParams["code"];
        if (hasPromoCode && len(promoCode) > 0) {
          bookingConfiguration := GetBookingConfiguration();
          discount, hasDiscount := bookingConfiguration.PromoCodes[promoCode];
          
          if (hasDiscount) {
            w.WriteHeader(http.StatusOK);
            w.Write([]byte(strconv.Itoa(discount)));
          } else {
            w.WriteHeader(http.StatusNotFound);          
          }
        } else {
          w.WriteHeader(http.StatusBadRequest);
          w.Write([]byte("Promo code not specified\n"))
        }
      } else {
        w.WriteHeader(http.StatusBadRequest);
        w.Write([]byte("Promo code not specified\n"))
      }
    } else {
      w.WriteHeader(http.StatusBadRequest);
    }
  } else if (r.Method == http.MethodPut) {
    request := parsePaymentRequest(r.Body);
    if (request == nil) {
      w.WriteHeader(http.StatusBadRequest);
      w.Write([]byte("Incorrect payment request format"));

      return;
    }

    reservation := GetReservation(request.ReservationId);
    if (reservation == nil) {
      w.WriteHeader(http.StatusNotFound);
      return;
    }

    if (strings.HasSuffix(r.URL.Path, "/deposit/")) {
      if (!isAdmin(sessionId)) {
        w.WriteHeader(http.StatusUnauthorized);
        return;
      }
    
      if (payDeposit(reservation, request)) {
        storedReservation, _ := json.Marshal(reservation);
        w.WriteHeader(http.StatusOK);
        w.Write(storedReservation);

        NotifyDepositPaid(request.ReservationId);
      } else {
        w.WriteHeader(http.StatusBadRequest);
      }
    } else {
      if (payReservation(reservation, request)) {
        storedReservation, _ := json.Marshal(reservation);
        w.WriteHeader(http.StatusOK);
        w.Write(storedReservation);

        NotifyReservationPaid(request.ReservationId);
      } else {
        w.WriteHeader(http.StatusBadRequest);
      }
    }
  } else if (r.Method == http.MethodDelete) {
    reservationId := *Sessions[sessionId].ReservationId;

    if (reservationId == NO_RESERVATION_ID) {
      w.WriteHeader(http.StatusNotFound);
      w.Write([]byte("No reservation selected"));

      return;
    }
  
    reservation := GetReservation(reservationId);
    if (reservation == nil) {
      w.WriteHeader(http.StatusNotFound);
      w.Write([]byte("Reservation not found"));

      return;
    }
    
    isAdmin := isAdmin(sessionId);
    if (strings.HasSuffix(r.URL.Path, "/deposit/")) {
      if (!isAdmin) {
        w.WriteHeader(http.StatusUnauthorized);
        return;
      }

      if (refundDeposit(reservation)) {
        storedReservation, _ := json.Marshal(reservation);
        w.WriteHeader(http.StatusOK);
        w.Write(storedReservation);

        NotifyDepositRefunded(reservation.Id);
      } else {
        w.WriteHeader(http.StatusBadRequest);
      }
    } else {
      if (refundReservation(reservation, isAdmin)) {
        storedReservation, _ := json.Marshal(reservation);
        w.WriteHeader(http.StatusOK);
        w.Write(storedReservation);

        if (isAdmin) {
          NotifyReservationCancelled(reservation.Id);
        } else {
          NotifyReservationRefunded(reservation.Id);
        }
      } else {
        w.WriteHeader(http.StatusBadRequest);
      }
    }
  }
}



func payReservation(reservation *TReservation, request *TPaymentRequest) bool {
  fmt.Printf("Starting payment processing for reservation %s\n", request.ReservationId);
  
  if (reservation.PaymentStatus == PAYMENT_STATUS_PAYED) {
    fmt.Printf("Reservation %s is already paid\n", reservation.Id);

    return false;
  }

  var paidAmount float64 = -1;
  for _, rate := range bookingConfiguration.Locations[reservation.LocationId].Boats[reservation.BoatId].Rate {
    if (reservation.Slot.Duration >= rate.RangeMin && reservation.Slot.Duration <= rate.RangeMax) {
      paidAmount = rate.Price;
      break;
    }
  }
  if (paidAmount < 0) {
    fmt.Printf("WARNING: reservation %s references a slot that does not have a corresponding rental rate\n", request.ReservationId);
    return false;
  }
  
  bookingConfiguration := GetBookingConfiguration();
  for extraId, included := range reservation.Extras {
    if (included) {
      paidAmount += bookingConfiguration.Locations[reservation.LocationId].Extras[extraId].Price;
    }
  }
  
  if (reservation.PromoCode != "") {
    discount, hasPromoCode := bookingConfiguration.PromoCodes[reservation.PromoCode];
    if (hasPromoCode) {
      discountAmount := paidAmount * float64(discount) / 100;
      paidAmount = paidAmount - discountAmount;
    }
  }

  if (GetSystemConfiguration().PaymentConfiguration.Enabled) {
    stripe.Key = GetSystemConfiguration().PaymentConfiguration.SecretKey;

    params := &stripe.ChargeParams {
      Amount: uint64(paidAmount * 100),
      Currency: "usd",
      Desc: "Boat reservation #" + string(request.ReservationId),
    }

    params.SetSource(request.PaymentToken);
    params.AddMeta("reservation_id", string(request.ReservationId));


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

func refundReservation(reservation *TReservation, isAdmin bool) bool {
  fmt.Printf("Starting refund processing for reservation %s\n", reservation.Id);

  if (reservation.PaymentStatus != PAYMENT_STATUS_PAYED) {
    fmt.Printf("Reservation %s is not paid - cannot refund\n", reservation.Id);

    return false;
  }

  var cancellationFee float64 = 0;
  if (isAdmin) {
    fmt.Printf("Cancelling by admin - no fees\n");
  } else {
    cancellationFee = getNonRefundableFee(reservation);
    fmt.Printf("Non refundable fees = %d\n", cancellationFee);
  }
  
  // TODO: This is a potential hole - a reservation may be created with this field pre-set
  refundAmount := reservation.PaymentAmount;
  
  if (reservation.PaymentAmount > cancellationFee) {
    refundAmount = reservation.PaymentAmount - cancellationFee;
  } else {
    refundAmount = 0;
  }
  fmt.Printf("Original payment = %d, refund amount = %d\n", reservation.PaymentAmount, refundAmount);
  
  if (GetSystemConfiguration().PaymentConfiguration.Enabled) {
    stripe.Key = GetSystemConfiguration().PaymentConfiguration.SecretKey;

    params := &stripe.RefundParams {
      Charge: reservation.ChargeId,
      Amount: uint64(refundAmount * 100),
    }

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



func payDeposit(reservation *TReservation, request *TPaymentRequest) bool {
  fmt.Printf("Starting deposit payment processing for reservation %s\n", request.ReservationId);

  if (reservation.DepositStatus == PAYMENT_STATUS_PAYED) {
    fmt.Printf("Deposit for reservation %s is already paid\n", reservation.Id);

    return false;
  }

  depositAmount := bookingConfiguration.Locations[reservation.LocationId].Boats[reservation.BoatId].Deposit;
  
  if (GetSystemConfiguration().PaymentConfiguration.Enabled) {
    stripe.Key = GetSystemConfiguration().PaymentConfiguration.SecretKey;

    params := &stripe.ChargeParams {
      Amount: uint64(depositAmount * 100),
      NoCapture: true, // Only authorizing, but no charge.
      Currency: "usd",
      Desc: "Security deposit for #" + string(request.ReservationId),
    }

    params.SetSource(request.PaymentToken);
    params.AddMeta("reservation_id", string(request.ReservationId));


    charge, err := charge.New(params);
    
    if (err != nil) {
      fmt.Printf("Payment for reservation %s failed with error %s\n", request.ReservationId, err.Error());
      reservation.DepositStatus = PAYMENT_STATUS_FAILED;
      SaveReservation(reservation);

      fmt.Printf("Deposit processing for reservation %s failed\n", reservation.Id);

      return false;
    } else {
      reservation.DepositChargeId = charge.ID;
      reservation.DepositAmount = depositAmount;
      reservation.DepositStatus = PAYMENT_STATUS_PAYED;
      SaveReservation(reservation);

      fmt.Printf("Deposit processing for reservation %s is complete successfully\n", reservation.Id);

      return true;
    }
  } else {
    fmt.Println("Payments turned off - payment will not be processed thru the payent portal");
    
    reservation.DepositChargeId = "fake deposit charge";
    reservation.DepositAmount = depositAmount;
    reservation.DepositStatus = PAYMENT_STATUS_PAYED;
    SaveReservation(reservation);

    return true;
  }
}

func refundDeposit(reservation *TReservation) bool {
  fmt.Printf("Starting deposit refund processing for reservation %s\n", reservation.Id);

  if (reservation.DepositStatus != PAYMENT_STATUS_PAYED) {
    fmt.Printf("Deposit for reservation %s is not paid - cannot refund\n", reservation.Id);

    return false;
  }

  fuelUsed := float64(bookingConfiguration.Locations[reservation.LocationId].Boats[reservation.BoatId].TankSize * reservation.FuelUsage / 100);
  fuelAmount := bookingConfiguration.GasPrice * fuelUsed;
  lateFee := getLateFee(reservation);
  
  if (GetSystemConfiguration().PaymentConfiguration.Enabled) {
    stripe.Key = GetSystemConfiguration().PaymentConfiguration.SecretKey;

/*
    params := &stripe.RefundParams {
      Charge: reservation.DepositChargeId,
      Amount: uint64((depositAmount - fuelAmount) * 100),
    }
  
    refund, err := refund.New(params);
*/

    // Charging initial authorization for the fuel amount and late fee
    depositAmount := bookingConfiguration.Locations[reservation.LocationId].Boats[reservation.BoatId].Deposit;
    if (fuelAmount + lateFee > depositAmount) {
      lateFee = depositAmount - fuelAmount;
    }

    params := &stripe.CaptureParams {
      Amount: uint64((fuelAmount + lateFee) * 100),
    }
    afterRentalCharge, err := charge.Capture(reservation.DepositChargeId, params);

    if (err != nil) {
      fmt.Printf("Deposit refund for reservation %s failed with error %s\n", reservation.Id, err.Error());
      SaveReservation(reservation);

      fmt.Printf("Deposit refund processing for reservation %s failed\n", reservation.Id);

      return false;
    } else {
      reservation.DepositRefundId = afterRentalCharge.ID;
      reservation.DepositStatus = PAYMENT_STATUS_REFUNDED;
      reservation.FuelCharge = fuelAmount;
      reservation.LateFee = lateFee;
      SaveReservation(reservation);

      fmt.Printf("Deposit refund processing for reservation %s is complete successfully\n", reservation.Id);

      return true;
    }
  } else {
    fmt.Println("Payments turned off - deposit refund will not be processed thru the payent portal");
    
    reservation.DepositRefundId = "fake after-rental charge/refund";
    reservation.DepositStatus = PAYMENT_STATUS_REFUNDED;
    reservation.FuelCharge = fuelAmount;
    reservation.LateFee = lateFee;
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


func getNonRefundableFee(reservation *TReservation) float64 {
  bookingConfiguration := GetBookingConfiguration();
  
  currentTime := time.Now().UTC().UnixNano() / int64(time.Millisecond);
  timeLeftToTrip := int((reservation.Slot.DateTime - currentTime) / 1000 / 60 / 60);
  
  var matchingFee *TPricedRange = nil;
  for _, fee := range bookingConfiguration.CancellationFees {
    if (fee.RangeMin <= timeLeftToTrip && timeLeftToTrip < fee.RangeMax) {
      matchingFee = &fee;
      break;
    } else {
      if (matchingFee == nil || fee.RangeMin < matchingFee.RangeMin) {
        matchingFee = &fee; 
      }
    }
  }

  if (timeLeftToTrip < matchingFee.RangeMax) {
    return matchingFee.Price;
  } else {
    return 0;
  }
}

func getLateFee(reservation *TReservation) float64 {
  bookingConfiguration := GetBookingConfiguration();
  
  var matchingFee *TPricedRange = nil;
  for _, fee := range bookingConfiguration.LateFees {
    if (fee.RangeMin <= reservation.Delay && reservation.Delay <= fee.RangeMax) {
      matchingFee = &fee;
      break;
    }
  }

  if (matchingFee != nil) {
    return matchingFee.Price;
  } else {
    return 0;
  }
}

func isAdmin(sessionId TSessionId) bool {
  if (*Sessions[sessionId].AccountId == NO_OWNER_ACCOUNT_ID) {
    return false;
  }

  account := GetOwnerAccount(*Sessions[sessionId].AccountId);
  return account != nil && account.Type == OWNER_ACCOUNT_TYPE_ADMIN;
}
