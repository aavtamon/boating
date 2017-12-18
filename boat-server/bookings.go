package main

import "log"
import "strings"
import "encoding/json"
import "net/http"
import "strconv"
import "time"
import "fmt"


type TBookingSettings struct {
  CurrentDate int64 `json:"current_date"`;
  SchedulingBeginDate int64 `json:"scheduling_begin_date"`;
  SchedulingEndDate int64 `json:"scheduling_end_date"`;
}

type TRental struct {
  Slot TBookingSlot `json:"slot,omitempty"`;
  LocationId string `json:"location_id,omitempty"`;
  BoatId string `json:"boat_id,omitempty"`;
  Status string `json:"status,omitempty"`;
}

type TRentalStat struct {
  Rentals map[TReservationId]*TRental `json:"rentals,omitempty"`;
}



type TAvailableDates map[int64]int;



type TReservationObserver struct {
}


var bookingSettings *TBookingSettings = nil;
var availableSlots map[int64][]TBookingSlot = nil;
var availableDates TAvailableDates = nil;
var reservationObserver TReservationObserver;


func BookingsHandler(w http.ResponseWriter, r *http.Request) {
  log.Println("Bookings Handler");
  
  if (r.Method == http.MethodGet) {
    w.Header().Set("Content-Type", "application/json")

    if (strings.HasSuffix(r.URL.Path, "available_slots")) {
      queryParams := parseQuery(r);
      
      dateStr, hasDate := queryParams["date"];
      
      if (!hasDate) {
        w.WriteHeader(http.StatusBadRequest);
        w.Write([]byte("Date is not provided\n"));

        return;
      }
      
/*
      settings := GetBookingSettings();

      var pickupLocation *TPickupLocation = nil;
      for id, location := range settings.AvailableLocations {
        if (id == locationId) {
          pickupLocation = &location;
        }
        break;
      }

      if (pickupLocation == nil) {
        w.WriteHeader(http.StatusBadRequest);
        w.Write([]byte("Unknown location id\n"));

        return;
      }
*/  

      date, err := strconv.ParseInt(dateStr, 10, 64);
      if (err != nil) {
        w.WriteHeader(http.StatusBadRequest);
        w.Write([]byte("Incorrect date\n"));

        return;
      }

      slots := getAvailableBookingSlots(date);
      if (slots != nil) {
        slotJson, err := json.Marshal(slots);
        if (err != nil) {
          w.WriteHeader(http.StatusInternalServerError);
          w.Write([]byte(err.Error()));
        } else {
          w.WriteHeader(http.StatusOK);
          w.Write(slotJson);
        }
      } else {
        w.WriteHeader(http.StatusNotFound);
        w.Write([]byte("No slots available\n"));
      }
    } else {
      w.WriteHeader(http.StatusBadRequest);
      w.Write([]byte("incorrect resource\n"));
    }
  } else {
    w.WriteHeader(http.StatusBadRequest);
    w.Write([]byte("Incorrect method\n"));
  }
}



func InitializeBookings() {
  initBookingSettings();    

  AddReservationListener(reservationObserver);
  
  schedulePeriodicBookingRefresh();
  schedulePeriodicNotifications();
}

func GetBookingSettings() *TBookingSettings {
  return bookingSettings;
}

func GetAvailableDates() TAvailableDates {
  return availableDates;
}

func GetOwnerRentalStat(accountId TOwnerAccountId) *TRentalStat {
  if (accountId == NO_OWNER_ACCOUNT_ID) {
    return nil;
  }


  account := ownerAccountMap[accountId];
  
  rentalStat := &TRentalStat{};
  rentalStat.Rentals = make(map[TReservationId]*TRental);
  
  for _, reservation := range persistenceDb.Reservations {
    if (reservation.OwnerAccountId != accountId) {
      boatIds, hasLocation := account.Locations[reservation.LocationId];
      if (hasLocation) {
        for _, id := range boatIds.Boats {
          if (id == reservation.BoatId) {
            rentalStat.Rentals[reservation.Id] = &TRental{};

            rentalStat.Rentals[reservation.Id].LocationId = reservation.LocationId;
            rentalStat.Rentals[reservation.Id].BoatId = reservation.BoatId;
            rentalStat.Rentals[reservation.Id].Slot = reservation.Slot;  
            rentalStat.Rentals[reservation.Id].Status = reservation.Status;
          }
        }
      }
    }
  }
  
  return rentalStat;
}


func getAvailableBookingSlots(date int64) []TBookingSlot {
  return availableSlots[date];
}



func initBookingSettings() {
  if (bookingSettings == nil) {
    bookingSettings = new(TBookingSettings);
  }

  refreshBookingAvailability();
}

func refreshBookingAvailability() {
  currentTime := time.Now().UTC();
  currentDate := time.Date(currentTime.Year(), currentTime.Month(), currentTime.Day(), 0, 0, 0, 0, time.UTC);
  currentDateAsInt := currentDate.UnixNano() / int64(time.Millisecond);

  bookingSettings.CurrentDate = currentDateAsInt;
  
  
  beginDate := currentDate.AddDate(0, 0, bookingConfiguration.SchedulingBeginOffset);
  schedulingBeginDate, err := time.Parse("2006-Jan-2", bookingConfiguration.SchedulingBeginDate);
  if (err == nil && schedulingBeginDate.After(beginDate)) {
    beginDate = schedulingBeginDate;
  }
  bookingSettings.SchedulingBeginDate = beginDate.UnixNano() / int64(time.Millisecond);
  
  endDate := currentDate.AddDate(0, 0, bookingConfiguration.SchedulingEndOffset);
  schedulingEndDate, err := time.Parse("2006-Jan-2", bookingConfiguration.SchedulingEndDate);
  if (err == nil && schedulingEndDate.Before(endDate)) {
    endDate = schedulingEndDate;
  }
  bookingSettings.SchedulingEndDate = endDate.UnixNano() / int64(time.Millisecond);
  

  for locationId := range bookingConfiguration.Locations {
    for boatId := range bookingConfiguration.Locations[locationId].Boats {
      recalculateAllAvailableSlots(locationId, boatId);
    }
  }  
  
  fmt.Println("Bookings availability refreshed");
}


func (observer TReservationObserver) OnReservationChanged(reservation *TReservation) {
  location := bookingConfiguration.Locations[reservation.LocationId];
  boat := bookingConfiguration.Locations[reservation.LocationId].Boats[reservation.BoatId];

  reservationTime := time.Unix(0, reservation.Slot.DateTime * int64(time.Millisecond));
  reservationDate := time.Date(reservationTime.Year(), reservationTime.Month(), reservationTime.Day(), 0, 0, 0, 0, time.UTC);

  calculateSlotsForDate(location, boat, reservationDate);
}

func (observer TReservationObserver) OnReservationRemoved(reservation *TReservation) {
  observer.OnReservationChanged(reservation);
}



func recalculateAllAvailableSlots(locationId string, boatId string) {
  location := bookingConfiguration.Locations[locationId];
  boat := bookingConfiguration.Locations[locationId].Boats[boatId];

  fmt.Printf("Recalculating ALL slots for location %s and boat %s\n", location.Name, boat.Name);

  availableDates = make(map[int64]int);
  availableSlots = make(map[int64][]TBookingSlot);

  beginDate := time.Unix(0, bookingSettings.CurrentDate * int64(time.Millisecond));
  for counter := bookingConfiguration.SchedulingBeginOffset; counter <= bookingConfiguration.SchedulingEndOffset; counter++ {
    slotDate := beginDate.Add(time.Duration(counter * 24) * time.Hour);
    calculateSlotsForDate(location, boat, slotDate);
  }
  
    
  fmt.Println("Recalculation complete");
}

func calculateSlotsForDate(location TRentalLocation, boat TBoat, date time.Time) {
  dateMs := date.UnixNano() / int64(time.Millisecond);
  
  fmt.Printf("Recalculating slots for location %s and boat %s. Date=%d\n", location.Name, boat.Name, dateMs);

  result := []TBookingSlot{};
  
  for hour := location.StartHour; hour <= location.EndHour; hour += (location.Duration + location.ServiceInterval) {
    slotTime := date.Add(time.Hour * time.Duration(hour)).UnixNano() / int64(time.Millisecond);
    
    slotPrice := uint64(0);
    for dur := location.Duration; hour + dur <= location.EndHour; dur += location.Duration {
      slotPrice = 0;
      for _, rate := range boat.Rate {
        if (rate.RangeMin >= int64(dur) && int64(dur) <= rate.RangeMax) {
          slotPrice = rate.Price;
          break;
        }
      }
    
      if (slotPrice != 0) {
        slot := TBookingSlot {DateTime: slotTime, Duration: dur, Price: slotPrice};
        if (!isBooked(slot)) {
          result = append(result, slot);
        }        
      } else {
        fmt.Printf("Problem detected while building slots - there is no price range for duration %d\n", dur);
      }
    }
  }
  
  availableSlots[dateMs] = result;

  availableDates[dateMs] = len(result);
  
  fmt.Println("******");
}

func isBooked(slot TBookingSlot) bool {
  for _, reservation := range GetAllReservations() {
    if (reservation.Status != RESERVATION_STATUS_BOOKED) {
      continue;
    }
  
    if (reservation.Slot.DateTime <= slot.DateTime && reservation.Slot.DateTime + int64(time.Duration(reservation.Slot.Duration) * time.Hour / time.Millisecond) > slot.DateTime) {
      return true;
    }
    
    if (reservation.Slot.DateTime >= slot.DateTime && reservation.Slot.DateTime < slot.DateTime + int64(time.Duration(slot.Duration) * time.Hour / time.Millisecond)) {
      return true;
    }
  }
  
  return false;
}


func notifyUpcomingBookings(now time.Time) {
  utcTime := now.UTC();
  dayBeforeNotificationLowerBound := utcTime.AddDate(0, 0, 1);
  dayBeforeNotificationUpperBound := dayBeforeNotificationLowerBound.Add(time.Hour);

  comingSoonNotificationLowerBound := utcTime.Add(2 * time.Hour);
  comingSoonNotificationUpperBound := comingSoonNotificationLowerBound.Add(time.Hour);

  for reservationId, reservation := range GetAllReservations() {
    if (reservation.Status != RESERVATION_STATUS_BOOKED) {
      continue;
    }
    
    timeZoneOffset := GetBookingConfiguration().Locations[reservation.LocationId].TimeZoneOffset;
    reservationTime := time.Unix(reservation.Slot.DateTime / 1000, 0).Add(time.Duration(-timeZoneOffset) * time.Hour);

    if (reservationTime.After(dayBeforeNotificationLowerBound) && reservationTime.Before(dayBeforeNotificationUpperBound)) {
      dayBeforeNotification(reservationId);
    } else if (reservationTime.After(comingSoonNotificationLowerBound) && reservationTime.Before(comingSoonNotificationUpperBound)) {
      comingSoonNotification(reservationId);
    }
  }
}

func dayBeforeNotification(reservationId TReservationId) {
  NotifyDayBeforeReminder(reservationId);
}

func comingSoonNotification(reservationId TReservationId) {
  NotifyGetReadyReminder(reservationId);
}





func schedulePeriodicBookingRefresh() {
  tickChannel := time.Tick(24 * time.Hour);
  go func() {
    for range tickChannel {
      refreshBookingAvailability();
    }
  }();
}



func schedulePeriodicNotifications() {
  go func() {
    initialDelay := 60 - time.Now().Minute();
    time.Sleep(time.Duration(initialDelay) * time.Minute);
    
    tickChannel := time.Tick(time.Hour);
    for now := range tickChannel {
      notifyUpcomingBookings(now);
    }
  }();
}
