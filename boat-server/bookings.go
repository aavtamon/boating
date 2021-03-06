package main

import "log"
import "strings"
import "encoding/json"
import "net/http"
import "strconv"
import "time"
import "fmt"



type TSlotType int;
const (
  SlotTypeNone TSlotType = 0;
  SlotTypeRenter TSlotType = 1;
  SlotTypeOwner TSlotType = 2;
)

type TAvailableDates map[int64]TSlotType;



type TReservationObserver struct {
}


var availableSlots map[int64][]TBookingSlot = nil;
var availableDates TAvailableDates = nil;
var reservationObserver TReservationObserver;
var currentDate time.Time;
var schedulingBeginDate time.Time;
var schedulingEndDate time.Time;



func BookingsHandler(w http.ResponseWriter, r *http.Request) {
  if (r.Method == http.MethodGet) {
    w.Header().Set("Content-Type", "application/json")

    if (strings.HasSuffix(r.URL.Path, "available_slots/")) {
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

func GetAvailableDates() TAvailableDates {
  return availableDates;
}

func getAvailableBookingSlots(date int64) []TBookingSlot {
  return availableSlots[date];
}



func initBookingSettings() {
  beginDate, err := time.Parse("2 Jan 2006", bookingConfiguration.SchedulingBeginDate);
  if (err != nil) {
    log.Fatal("Scheduling begin date is malformed:", err);
  }
  schedulingBeginDate = beginDate;

  endDate, err := time.Parse("2 Jan 2006", bookingConfiguration.SchedulingEndDate);
  if (err != nil) {
    log.Fatal("Scheduling end date is malformed:", err);
  }
  schedulingEndDate = endDate;


  refreshBookingAvailability();
}

func refreshBookingAvailability() {
  currentTime := time.Now().UTC();
  currentDate = time.Date(currentTime.Year(), currentTime.Month(), currentTime.Day(), 0, 0, 0, 0, time.UTC);


  for locationId := range bookingConfiguration.Locations {
    for boatId := range bookingConfiguration.Locations[locationId].Boats {
        recalculateAllAvailableSlots(locationId, boatId);
    }
  }  
  
  fmt.Println("Bookings availability refreshed");
}


func (observer TReservationObserver) OnReservationChanged(reservation *TReservation) {
  reservationTime := time.Unix(0, reservation.Slot.DateTime * int64(time.Millisecond));
  reservationDate := time.Date(reservationTime.Year(), reservationTime.Month(), reservationTime.Day(), 0, 0, 0, 0, time.UTC);

  calculateSlotsForDate(reservation.LocationId, reservation.BoatId, reservationDate);
}

func (observer TReservationObserver) OnReservationRemoved(reservation *TReservation) {
  observer.OnReservationChanged(reservation);
}



func recalculateAllAvailableSlots(locationId string, boatId string) {
  fmt.Printf("Recalculating ALL slots for location %s and boat %s\n", locationId, boatId);

  availableDates = make(TAvailableDates);
  availableSlots = make(map[int64][]TBookingSlot);

  for counter := bookingConfiguration.SchedulingBeginOffset - 1; counter <= bookingConfiguration.SchedulingEndOffset; counter++ {
    slotDate := currentDate.Add(time.Duration(counter * 24) * time.Hour);

    if (slotDate.Before(schedulingBeginDate) || slotDate.After(schedulingEndDate)) {
      // skipping slot
    } else {
      calculateSlotsForDate(locationId, boatId, slotDate);
    }
  }
  
    
  fmt.Println("Recalculation complete");
}


func calculateSlotsForDate(locationId string, boatId string, date time.Time) {
  dateMs := date.UnixNano() / int64(time.Millisecond);

  location := bookingConfiguration.Locations[locationId];
  boat := bookingConfiguration.Locations[locationId].Boats[boatId];

  //fmt.Printf("Recalculating slots for location %s and boat %s. Date=%d\n", locationId, boatId, dateMs);

  result := []TBookingSlot{};
  
  var ownership TSlotType;
  dailySchedule := location.BookingSchedule[date.Weekday().String()];
  if (dailySchedule != nil) {
    ownership = SlotTypeRenter; // If we have this day in the schedule then this date should be visible to renters. Otherwise it is just for owners
    if (len(dailySchedule) == 0) {
      // We have a day in the schedule but no specific daily schedule - use the default
      dailySchedule = location.BookingSchedule["All"];
    }
  } else {
    ownership = SlotTypeOwner;
    dailySchedule = location.BookingSchedule["All"];
  }
  
  if (dailySchedule != nil) {
    for startHourString, durations := range dailySchedule {
      startHour, _ := strconv.Atoi(startHourString);
      slotTime := date.Add(time.Hour * time.Duration(startHour)).UnixNano() / int64(time.Millisecond);
      for _, duration := range durations {
        var price float64 = 0;
        for _, rate := range boat.Rate {
          if (int(rate.RangeMax) >= duration && int(rate.RangeMin) >= duration) {
            price = rate.Price;
            break;
          }
        }

        if (price > 0) {
          slot := TBookingSlot {DateTime: slotTime, Duration: duration, Price: price};
          if (!isBooked(locationId, boatId, slot)) {
            result = append(result, slot);
          }
        }
      }
    }
  }
  
  availableSlots[dateMs] = result;
  if (len(result) > 0) {
    availableDates[dateMs] = ownership;
  } else {
    availableDates[dateMs] = SlotTypeNone;
  }
}



func isBooked(locationId string, boatId string, slot TBookingSlot) bool {
  location := bookingConfiguration.Locations[locationId];

  for _, reservation := range GetActiveReservations() {
    if (reservation.LocationId != locationId || reservation.BoatId != boatId) {
      continue;
    }
    
    
    if (slot.DateTime < reservation.Slot.DateTime + int64(time.Duration(reservation.Slot.Duration + location.ServiceInterval) * time.Hour / time.Millisecond) && slot.DateTime + int64(time.Duration(slot.Duration) * time.Hour / time.Millisecond) > reservation.Slot.DateTime) {
        
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

  for reservationId, reservation := range GetActiveReservations() {
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
