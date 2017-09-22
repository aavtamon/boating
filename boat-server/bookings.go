package main

import "log"
import "strings"
import "encoding/json"
import "net/http"
import "strconv"
import "time"


type TMapLocation struct {
  Latitude float64;
  Longitude float64;
  Zoom int;
}

type TPickupLocation struct {
  Id string;
  Location TMapLocation;
  Name string;
  Address string;
  ParkingFee string;
  Instructions string;
}


type TBookingSlot struct {
  DateTime int64 `json:"time"`;
  Duration int `json:"duration"`;
  Price int `json:"price"`;
}


type TBookingSettings struct {
  CurrentDate int64;
  SchedulingBeginDate int64;
  SchedulingEndDate int64;  
  MaximumCapacity int;
  
  CenterLocation TMapLocation;
  AvailableLocations []TPickupLocation;
  
  AvailableDates map[int64]int;
}


var bookingSettings *TBookingSettings = nil;

var availableSlots map[int64][]TBookingSlot = nil;


func GetBookingSettings() TBookingSettings {
  if (bookingSettings == nil) {
    initBookingSettings();
  }

  return *bookingSettings;
}




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
      for _, location := range settings.AvailableLocations {
        if (location.Id == locationId) {
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





func getAvailableBookingSlots(date int64) []TBookingSlot {
  return availableSlots[date];
}






func initBookingSettings() {
  log.Println("Initializing bookign settings");
  
  
  currentTime := time.Now();
  currentDate := time.Date(currentTime.Year(), currentTime.Month(), currentTime.Day(), 0, 0, 0, 0, currentTime.Location());

  day1 := currentDate;
  day1Ms := day1.UnixNano() / int64(time.Millisecond);
  day1Slot1 := day1.Add(time.Hour * 10);
  day1Slot1Ms := day1Slot1.UnixNano() / int64(time.Millisecond);
  day1Slot2 := day1.Add(time.Hour * 14);
  day1Slot2Ms := day1Slot2.UnixNano() / int64(time.Millisecond);


  day2 := currentDate.AddDate(0, 0, 3);
  day2Ms := day2.UnixNano() / int64(time.Millisecond);
  day2Slot1 := day1.Add(time.Hour * 10);
  day2Slot1Ms := day2Slot1.UnixNano() / int64(time.Millisecond);
  day2Slot2 := day1.Add(time.Hour * 16);
  day2Slot2Ms := day2Slot2.UnixNano() / int64(time.Millisecond);


  availableSlots = map[int64][]TBookingSlot {
    day1Ms: []TBookingSlot {
             TBookingSlot {DateTime: day1Slot1Ms, Duration: 2, Price: 150},
             TBookingSlot {DateTime: day1Slot2Ms, Duration: 1, Price: 100},
             TBookingSlot {DateTime: day1Slot2Ms, Duration: 2, Price: 150},
           },
    day2Ms: []TBookingSlot {
             TBookingSlot {DateTime: day2Slot1Ms, Duration: 2, Price: 150},
             TBookingSlot {DateTime: day2Slot1Ms, Duration: 4, Price: 200},
             TBookingSlot {DateTime: day2Slot2Ms, Duration: 1, Price: 100},
             TBookingSlot {DateTime: day2Slot2Ms, Duration: 2, Price: 150},
           },
  };

  
  
  
  
  bookingSettings = new(TBookingSettings);
  
  (*bookingSettings).CurrentDate = currentDate.UnixNano() / int64(time.Millisecond);
  (*bookingSettings).SchedulingBeginDate = currentDate.UnixNano() / int64(time.Millisecond);
  (*bookingSettings).SchedulingEndDate = currentDate.AddDate(0, 2, 0).UnixNano() / int64(time.Millisecond);
  (*bookingSettings).MaximumCapacity = 10;
  
  (*bookingSettings).CenterLocation = TMapLocation {Latitude:  34.2288159, Longitude: -83.9592255, Zoom: 11};
  
  (*bookingSettings).AvailableLocations = []TPickupLocation {
    TPickupLocation {Id: "1", Location: TMapLocation{Latitude: 34.2169323, Longitude: -83.9452699, Zoom: 0}, Name: "Great Marina", Address: "1745 Lanier Islands Parkway, Suwanee 30024", ParkingFee: "free", Instructions: "none"},
    TPickupLocation {Id: "2", Location: TMapLocation{Latitude: 34.2305583, Longitude: -83.9294771, Zoom: 0}, Name: "Parking lot at the beach", Address: "1111 Lanier Islands Parkway, Suwanee 30024", ParkingFee: "$4 per car (cach only)", Instructions: "proceed to the boat ramp"},
    TPickupLocation {Id: "3", Location: TMapLocation{Latitude: 34.2700139, Longitude: -83.8967458, Zoom: 0}, Name: "Dam parking", Address: "2222 Buford Highway, Cumming 30519", ParkingFee: "$3 per person (credit card accepted)", Instructions: "follow 'boat ramp' signs"},
  };
  
  (*bookingSettings).AvailableDates = make(map[int64]int);
  for date, bookingSlots := range availableSlots {
    (*bookingSettings).AvailableDates[date] = len(bookingSlots);
  }
}