package main

import "log"
import "strings"
import "encoding/json"
import "net/http"
import "strconv"


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
  MinDuration int `json:"min_duration"`;
  MaxDuration int `json:"max_duration"`;
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


var availableSlots = map[int64][]TBookingSlot {
    1032926400000: []TBookingSlot {
             TBookingSlot {DateTime: 1032926400000, MinDuration: 2, MaxDuration: 2},
             TBookingSlot {DateTime: 1032926410000, MinDuration: 1, MaxDuration: 2},
           },
    1033185600000: []TBookingSlot {
             TBookingSlot {DateTime: 1033185600000, MinDuration: 2, MaxDuration: 2},
             TBookingSlot {DateTime: 1033185610000, MinDuration: 1, MaxDuration: 2},
           },
};


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
  
  bookingSettings = new(TBookingSettings);
  
  (*bookingSettings).CurrentDate = 23295924;
  (*bookingSettings).SchedulingBeginDate = 23295924;
  (*bookingSettings).SchedulingEndDate = 23296924;
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