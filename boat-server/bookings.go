package main

import "log"
import "strings"
import "encoding/json"
import "net/http"
import "strconv"
import "time"
import "fmt"


type TMapLocation struct {
  Latitude float64 `json:"lat"`;
  Longitude float64 `json:"lng"`;
  Zoom int `json:"zoom"`;
}

type TPickupLocation struct {
  Location TMapLocation `json:"location"`;
  Name string `json:"name"`;
  Address string `json:"address"`;
  ParkingFee string `json:"parking_fee"`;
  Instructions string `json:"instructions"`;
}


type TBookingSlot struct {
  DateTime int64 `json:"time"`;
  Duration int `json:"duration"`;
  Price uint64 `json:"price"`;
}


type TPricedRange struct {
  RangeMin int64 `json:"range_min"`;
  RangeMax int64 `json:"range_max"`;
  Price uint64 `json:"price"`;
}

type TImageResource struct {
  Name string `json:"name"`;
  Url string `json:"url"`;
  Description string `json:"description"`;
}

type TBoat struct {
  Name string `json:"name"`;
  Type string `json:"type"`;
  Engine string `json:"engine"`;
  Mileage int `json:"mileage"`;
  MaximumCapacity int `json:"maximum_capacity"`;
  Rate []TPricedRange `json:"rate"`;
  Images []TImageResource `json:"images"`;
}

type TExtraEquipment struct {
  Name string `json:"name"`;
  Price uint64 `json:"price"`;
}


type TRentalLocation struct {
  Name string `json:"name"`;
  StartHour int `json:"start_hour"`;
  EndHour int `json:"end_hour"`;
  Duration int `json:"duration"`;
  ServiceInterval int `json:"service_interval"`;
  
  Boats map[string]TBoat `json:"boats"`;
  Extras map[string]TExtraEquipment `json:"extras"`;
  CenterLocation TMapLocation `json:"center_location"`;
  PickupLocations map[string]TPickupLocation `json:"pickup_locations"`;
}

type TBookingSettings struct {
  CurrentDate int64 `json:"current_date"`;
  SchedulingBeginDate int64 `json:"scheduling_begin_date"`;
  SchedulingEndDate int64 `json:"scheduling_end_date"`;
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
  
  schedulePeriodicRefresh();  
}

func GetBookingSettings() *TBookingSettings {
  return bookingSettings;
}

func GetAvailableDates() TAvailableDates {
  return availableDates;
}

func getAvailableBookingSlots(date int64) []TBookingSlot {
  return availableSlots[date];
}



func initBookingSettings() {
  if (bookingSettings == nil) {
    bookingSettings = new(TBookingSettings);
  }

  refresh();
}

func refresh() {
  currentTime := time.Now().UTC();
  currentDate := time.Date(currentTime.Year(), currentTime.Month(), currentTime.Day(), 0, 0, 0, 0, time.UTC);
  currentDateAsInt := currentDate.UnixNano() / int64(time.Millisecond);

  bookingSettings.CurrentDate = currentDateAsInt;
  bookingSettings.SchedulingBeginDate = currentDate.AddDate(0, 0, bookingConfiguration.SchedulingBeginOffset).UnixNano() / int64(time.Millisecond);
  bookingSettings.SchedulingEndDate = currentDate.AddDate(0, 0, bookingConfiguration.SchedulingEndOffset).UnixNano() / int64(time.Millisecond);

  for locationId := range bookingConfiguration.Locations {
    for boatId := range bookingConfiguration.Locations[locationId].Boats {
      recalculateAllAvailableSlots(locationId, boatId);
    }
  }  
  
  fmt.Println("Database refreshed");
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
    if (reservation.Slot.DateTime <= slot.DateTime && reservation.Slot.DateTime + int64(time.Duration(reservation.Slot.Duration) * time.Hour / time.Millisecond) > slot.DateTime) {
      return true;
    }
    
    if (reservation.Slot.DateTime >= slot.DateTime && reservation.Slot.DateTime < slot.DateTime + int64(time.Duration(slot.Duration) * time.Hour / time.Millisecond)) {
      return true;
    }
  }
  
  return false;
}



func schedulePeriodicRefresh() {
  ticker := time.NewTicker(24 * time.Hour);
  go func() {
    for {
       select {
         case <- ticker.C:
           refresh();
       }
    }
  }();
}
