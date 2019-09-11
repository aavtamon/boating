package main

import "log"
import "net/http"
import "io"
import "io/ioutil"
import "encoding/json"
import "fmt"
import "strings"
import "encoding/base64"
import "time"


type TReservationId string;
type TReservationStatus string;
type TPaymentStatus string;


type TReservation struct {
  Id TReservationId `json:"id"`;
  
  OwnerAccountId TOwnerAccountId `json:"owner_account_id"`;

  Timestamp int64 `json:"modification_timestamp,omitempty"`;
  
  LocationId string `json:"location_id"`;
  BoatId string `json:"boat_id"`;

  Slot TBookingSlot `json:"slot,omitempty"`;
  PickupLocationId string `json:"pickup_location_id"`;
  
  NumOfAdults int `json:"adult_count"`;
  NumOfChildren int `json:"children_count"`;
  
  Extras map[string]bool `json:"extras"`;

  DLState string `json:"dl_state,omitempty"`;
  DLNumber string `json:"dl_number,omitempty"`;
  FirstName string `json:"first_name,omitempty"`;
  LastName string `json:"last_name,omitempty"`;
  Email string `json:"email,omitempty"`;
  PrimaryPhone string `json:"primary_phone,omitempty"`;
  AlternativePhone string `json:"alternative_phone,omitempty"`;
  PaymentStatus TPaymentStatus `json:"payment_status,omitempty"`;
  PaymentAmount float64 `json:"payment_amount,omitempty"`;
  RefundAmount float64 `json:"refund_amount,omitempty"`;
  ChargeId string;
  RefundId string;
  DepositChargeId string;
  DepositRefundId string;
  DepositAmount float64 `json:"deposit_amount,omitempty"`;
  DepositStatus TPaymentStatus `json:"deposit_status,omitempty"`;
  FuelUsage int `json:"fuel_usage,omitempty"`;
  FuelCharge float64 `json:"fuel_charge,omitempty"`;
  Delay int `json:"delay,omitempty"`;
  LateFee float64 `json:"late_fee,omitempty"`;
  PromoCode string `json:"promo_code"`;
  Notes string `json:"notes"`;
  AdditionalDrivers []string `json:"additional_drivers,omitempty"`;
  
  Status TReservationStatus `json:"status,omitempty"`;
}

func (reservation TReservation) isActive() bool {
  return reservation.Status != RESERVATION_STATUS_CANCELLED && reservation.Status != RESERVATION_STATUS_COMPLETED && reservation.Status != RESERVATION_STATUS_ARCHIVED;
}

func (reservation TReservation) archive() {
  reservation.DLState = "";
  reservation.DLNumber = "";
  reservation.FirstName = "";
  reservation.LastName = "";
  reservation.Email = "";
  reservation.PrimaryPhone = "";
  reservation.AlternativePhone = "";
  reservation.AdditionalDrivers = nil;
  reservation.Status = RESERVATION_STATUS_ARCHIVED;
}

func (reservation TReservation) save() TReservationId {
  if (reservation.Id == NO_RESERVATION_ID) {
    reservation.Id = generateReservationId();
  }

  reservation.Timestamp = time.Now().UTC().Unix();
  
  SaveReservation(&reservation);

  notifyReservationUpdated(&reservation);

  return reservation.Id;
}

type TReservations map[TReservationId]*TReservation;


type TReservationSummary struct {
  Id TReservationId `json:"id"`;
  Slot TBookingSlot `json:"slot,omitempty"`;
}

type TRental struct {
  Slot TBookingSlot `json:"slot,omitempty"`;
  LocationId string `json:"location_id,omitempty"`;
  BoatId string `json:"boat_id,omitempty"`;
  LastName string `json:"last_name,omitempty"`;
  SafetyTestStatus bool `json:"safety_test_status"`;
  PaymentAmount float64 `json:"payment_amount,omitempty"`;
  Status TReservationStatus `json:"status,omitempty"`;
}

type TRentalStat struct {
  Rentals map[TReservationId]*TRental `json:"rentals,omitempty"`;
}

type TUsageStats struct {
  Periods []string `json:"periods,omitempty"`;
  BoatUsageStats map[string]*TBoatUsageStat `json:"boat_usages,omitempty"`;
}

type TBoatUsageStat struct {
  LocationId string `json:"location_id,omitempty"`;
  BoatId string `json:"boat_id,omitempty"`;
  Hours []int `json:"hours,omitempty"`;
}

const RESERVATION_STATUS_BOOKED TReservationStatus = "booked";
const RESERVATION_STATUS_CANCELLED TReservationStatus = "cancelled";
const RESERVATION_STATUS_DEPOSITED TReservationStatus = "deposited";
const RESERVATION_STATUS_COMPLETED TReservationStatus = "completed";
const RESERVATION_STATUS_ACCIDENT TReservationStatus = "accident";
const RESERVATION_STATUS_ARCHIVED TReservationStatus = "archived";



const PAYMENT_STATUS_PAYED TPaymentStatus = "payed";
const PAYMENT_STATUS_FAILED TPaymentStatus = "failed";
const PAYMENT_STATUS_REFUNDED TPaymentStatus = "refunded";


const NO_RESERVATION_ID = TReservationId("");



type TChangeListener interface {
  OnReservationChanged(reservation *TReservation);
  OnReservationRemoved(reservation *TReservation);
}

func AddReservationListener(listener TChangeListener) {
  listeners = append(listeners, listener);
}

var listeners []TChangeListener;








func ReservationHandler(w http.ResponseWriter, r *http.Request) {
  sessionId := GetSessionId(r);
  if (sessionId == NO_SESSION_ID) {
    w.WriteHeader(http.StatusUnauthorized);
    w.Write([]byte("Invalid session id\n"));
    return;
  }

  if (r.Method == http.MethodGet) {
    handleGetReservation(w, r, sessionId);
  } else if (r.Method == http.MethodPut) {
    if (strings.HasSuffix(r.URL.Path, "/email/")) {
      handleSendConfirmationEmail(w, r, sessionId);
    } else {
      handleSaveReservation(w, r, sessionId);
    }
  } else if (r.Method == http.MethodDelete) {
    handleDeleteReservation(w, r, sessionId);
  }
}


func handleGetReservation(w http.ResponseWriter, r *http.Request, sessionId TSessionId) {
  if (r.URL.RawQuery != "") {
    queryParams := parseQuery(r);

    queryReservationId, hasReservationId := queryParams["reservation_id"];
    queryLastName, hasLastName := queryParams["last_name"];

    fmt.Printf("Restoring reservation %s for %s\n", queryParams["reservation_id"], queryParams["last_name"]);

    if (hasReservationId) {
      reservationId := TReservationId(queryReservationId);

      var reservation *TReservation = nil;
      
      if (hasLastName) {
        reservation = RecoverReservation(reservationId, queryLastName);
      } else {
        accountId := *Sessions[sessionId].AccountId;
        if (accountId != NO_OWNER_ACCOUNT_ID) {
          reservation = RecoverOwnerReservation(reservationId, accountId);
        }
      }
      
      if (reservation != nil) {
        storedReservation, err := json.Marshal(reservation);
        if (err != nil) {
          w.WriteHeader(http.StatusInternalServerError);
          w.Write([]byte(err.Error()));
        } else {
          w.WriteHeader(http.StatusOK);
          w.Write(storedReservation);

          *Sessions[sessionId].ReservationId = reservation.Id;
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
    reservationId := *Sessions[sessionId].ReservationId;
    w.WriteHeader(http.StatusOK);
    if (reservationId == NO_RESERVATION_ID) {
      w.Write([]byte("{}\n"))
    } else {
      reservationJson, _ := json.Marshal(GetReservation(reservationId));
      w.Write(reservationJson);
    }
  }
}

func handleSaveReservation(w http.ResponseWriter, r *http.Request, sessionId TSessionId) {
  reservation := parseReservation(r.Body);
  reservationId := reservation.Id;

  if (reservation != nil) {
    existingReservation := GetReservation(reservationId);
    if (existingReservation == nil) {
      // Handling reservation creation
      
      //TODO: Verify integrity first - not all fields can be modified by the user
      if (reservation.PaymentStatus != "" || reservation.PaymentAmount != 0 || reservation.RefundAmount != 0 || reservation.DepositAmount != 0 || reservation.DepositStatus != "") {
        w.WriteHeader(http.StatusBadRequest);
        w.Write([]byte("Prohibited properties are passed in"));
        return;
      }

      if (isBooked(reservation.LocationId, reservation.BoatId, reservation.Slot)) {
        w.WriteHeader(http.StatusConflict);
        return;
      }


      reservation.Status = RESERVATION_STATUS_BOOKED;
      reservationId = reservation.save();
      existingReservation = GetReservation(reservationId);
      
      NotifyReservationBooked(reservationId);
    } else {
      // Handling reservation update
      // TODO: may need better validation
      
      reservationChanged := false;
      if (existingReservation.Status != reservation.Status && (reservation.Status == RESERVATION_STATUS_BOOKED || reservation.Status == RESERVATION_STATUS_DEPOSITED || reservation.Status == RESERVATION_STATUS_ACCIDENT || reservation.Status == RESERVATION_STATUS_COMPLETED)) {
        existingReservation.Status = reservation.Status;
        reservationChanged = true;
      }
      if (existingReservation.FuelUsage != reservation.FuelUsage && (reservation.FuelUsage > 0 && reservation.FuelUsage <= 100)) {
        existingReservation.FuelUsage = reservation.FuelUsage;
        reservationChanged = true;
      }
      if (existingReservation.Delay != reservation.Delay && reservation.Delay >= 0) {
        existingReservation.Delay = reservation.Delay;
        reservationChanged = true;
      }
      if (existingReservation.Notes != reservation.Notes) {
        if(len(reservation.Notes) < 4000) {
          _, err := base64.StdEncoding.DecodeString(reservation.Notes)
          if (err == nil) {
            existingReservation.Notes = reservation.Notes;
            reservationChanged = true;
          }
        } else {
          existingReservation.Notes = "input too long";
          reservationChanged = true;
        }
      }
      
      if (reservationChanged) {
        existingReservation.save();
        NotifyReservationUpdated(reservationId);
      }
    }


    
    if (existingReservation != nil) {
      storedReservation, _ := json.Marshal(existingReservation);
      w.WriteHeader(http.StatusOK);
      w.Write(storedReservation);

      *Sessions[sessionId].ReservationId = reservationId;
    } else {
      w.WriteHeader(http.StatusInternalServerError);
      w.Write([]byte("Failed to store reservation"));
    }
  } else {
    w.WriteHeader(http.StatusInternalServerError);
    w.Write([]byte("Incorrect reservation format"));
  }  
}

func handleDeleteReservation(w http.ResponseWriter, r *http.Request, sessionId TSessionId) {
  reservationId := *Sessions[sessionId].ReservationId;

  fmt.Printf("Removing reservation %s\n", reservationId);

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
  
  reservation.Status = RESERVATION_STATUS_CANCELLED;
  reservation.save();
  
  NotifyReservationCancelled(reservation, isAdmin(sessionId));

  *Sessions[sessionId].ReservationId = NO_RESERVATION_ID;

  w.WriteHeader(http.StatusOK);
}

func handleSendConfirmationEmail(w http.ResponseWriter, r *http.Request, sessionId TSessionId) {
  reservationId := *Sessions[sessionId].ReservationId;
  if (reservationId == NO_RESERVATION_ID) {
    w.WriteHeader(http.StatusNotFound);
    w.Write([]byte("No reservation selected"));

    return;
  }

  if (r.URL.RawQuery != "") {
    reservation := GetReservation(TReservationId(reservationId));
    if (reservation == nil) {
      w.WriteHeader(http.StatusNotFound);
      w.Write([]byte("Reservartion not found\n"))
    } else {
      queryParams := parseQuery(r);

      email, hasEmail := queryParams["email"];
      if (!hasEmail) {
        email = reservation.Email;
      }
    
      if (EmailReservationConfirmation(reservationId, email)) {
        w.WriteHeader(http.StatusOK);
      } else {
        w.WriteHeader(http.StatusInternalServerError);
      }
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





func notifyReservationUpdated(reservation *TReservation) {
  for _, listener := range listeners {
    listener.OnReservationChanged(reservation);
  }
}

func notifyReservationRemoved(reservation *TReservation) {
  for _, listener := range listeners {
    listener.OnReservationRemoved(reservation);
  }
}

