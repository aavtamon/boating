package main

import "log"


type TMapLocation struct {
  Latitude float64;
  Longitude float64;
  Zoom int;
}

type TPickupLocation struct {
  Id int;
  Location TMapLocation;
  Name string;
  Address string;
  ParkingFee string;
  Instructions string;
}


type TBookingSlot struct {
  DateTime int64;
  MinDuration int;
  MaxDuration int;
}


type TBookingSettings struct {
  CurrentDate int64;
  SchedulingBeginDate int64;
  SchedulingEndDate int64;  
  MaximumCapacity int;
  
  CenterLocation TMapLocation;
  AvailableLocations []TPickupLocation;

  AvailableTimes []TBookingSlot;
}


var bookingSettings *TBookingSettings = nil;


func GetBookingSettings() TBookingSettings {
  if (bookingSettings == nil) {
    initBookingSettings();
  }

  return *bookingSettings;
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
    TPickupLocation {Id: 1, Location: TMapLocation{Latitude: 34.2169323, Longitude: -83.9452699, Zoom: 0}, Name: "Great Marina", Address: "1745 Lanier Islands Parkway, Suwanee 30024", ParkingFee: "free", Instructions: "none"},
    TPickupLocation {Id: 2, Location: TMapLocation{Latitude: 34.2305583, Longitude: -83.9294771, Zoom: 0}, Name: "Parking lot at the beach", Address: "1111 Lanier Islands Parkway, Suwanee 30024", ParkingFee: "$4 per car (cach only)", Instructions: "proceed to the boat ramp"},
    TPickupLocation {Id: 3, Location: TMapLocation{Latitude: 34.2700139, Longitude: -83.8967458, Zoom: 0}, Name: "Dam parking", Address: "2222 Buford Highway, Cumming 30519", ParkingFee: "$3 per person (credit card accepted)", Instructions: "follow 'boat ramp' signs"},
  };

  (*bookingSettings).AvailableTimes = []TBookingSlot {
    TBookingSlot {DateTime: 23295924, MinDuration: 2, MaxDuration: 2},
    TBookingSlot {DateTime: 23296924, MinDuration: 1, MaxDuration: 2},
  }
}