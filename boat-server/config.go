package main

import "fmt"
import "io/ioutil"
import "encoding/json"


const SYSTEM_CONFIG_FILE_NAME = "system_configuration.json";
const BOOKING_CONFIG_FILE_NAME = "boat-server/booking_configuration.json";
const GENERAL_PARAMS_FILE_NAME = "boat-server/general_params.json";



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
  Deposit uint64 `json:"deposit"`;
}

type TExtraEquipment struct {
  Name string `json:"name"`;
  Price uint64 `json:"price"`;
}


type TRentalLocation struct {
  Name string `json:"name"`;
  TimeZoneOffset int `json:"time_zone_offset"`;
  StartHour int `json:"start_hour"`;
  EndHour int `json:"end_hour"`;
  Duration int `json:"duration"`;
  ServiceInterval int `json:"service_interval"`;
  
  Boats map[string]TBoat `json:"boats"`;
  Extras map[string]TExtraEquipment `json:"extras"`;
  CenterLocation TMapLocation `json:"center_location"`;
  PickupLocations map[string]TPickupLocation `json:"pickup_locations"`;
}

type TBookingConfiguration struct {
  SchedulingBeginDate string `json:"scheduling_begin_date"`;
  SchedulingEndDate string `json:"scheduling_end_date"`;
  SchedulingBeginOffset int `json:"scheduling_begin_offset"`;
  SchedulingEndOffset int `json:"scheduling_end_offset"`;
  CancellationFees []TPricedRange `json:"cancellation_fees"`;
  Locations map[string]TRentalLocation `json:"locations"`;
}


type TEmailConfiguration struct {
  Enabled bool `json:"enabled"`;
  SourceAddress string `json:"source_address"`;
  MailServer string `json:"mail_server"`;
  ServerPort string `json:"server_port"`;
  ServerPassword string `json:"server_password"`;
}
type TSMSConfiguration struct {
  Enabled bool `json:"enabled"`;
  AccountSid string `json:"account_sid"`;
  AuthToken string `json:"auth_token"`;
  SourcePhone string `json:"source_phone"`;
}
type TPaymentConfiguration struct {
  Enabled bool `json:"enabled"`;
  SecretKey string `json:"secret_key"`;
}
type TBookingExpirationConfiguration struct {
  CancelledTimeout int64 `json:"cancelled"`;
  CompletedTimeout int64 `json:"completed"`;
}


type TSystemConfiguration struct {
  Domain string `json:"domain"`;
  EmailConfiguration TEmailConfiguration `json:"email"`;
  SMSConfiguration TSMSConfiguration `json:"sms"`;
  PaymentConfiguration TPaymentConfiguration `json:"payment"`;
  BookingExpirationConfiguration TBookingExpirationConfiguration `json:"booking_expiration"`;
  SafetyTestHoldTime int64 `json:"safety_test_hold_time"`;
}


type TGeneralParams struct {
  ReservationEmail string `json:"reservation_email"`;
  SupportEmail string `json:"support_email"`;
}



var bookingConfiguration *TBookingConfiguration;
var systemConfiguration *TSystemConfiguration;
var generalParams *TGeneralParams;


func InitializeSystemConfig() {
  readSystemConfiguration();
  readBookingConfiguration();
  readGeneralParams();
}



func GetSystemConfiguration() *TSystemConfiguration {
  return systemConfiguration;
}

func GetBookingConfiguration() *TBookingConfiguration {
  return bookingConfiguration;
}

func GetGeneralParams() *TGeneralParams {
  return generalParams;
}





func readSystemConfiguration() {
  configurationByteArray, err := ioutil.ReadFile(RuntimeRoot + "/" + SYSTEM_CONFIG_FILE_NAME);
  if (err == nil) {
    systemConfiguration = &TSystemConfiguration{};
    err := json.Unmarshal(configurationByteArray, systemConfiguration);
    if (err != nil) {
      fmt.Println("Persistance: failed to parse system config file", err);
    } else {
      fmt.Println("Persistance: system config is read");
    }
  } else {
    fmt.Println("Persistance: failed to read booking config", err);
  }
}

func readBookingConfiguration() {
  configurationByteArray, err := ioutil.ReadFile(RuntimeRoot + "/" + BOOKING_CONFIG_FILE_NAME);
  if (err == nil) {
    bookingConfiguration = &TBookingConfiguration{};
    err := json.Unmarshal(configurationByteArray, bookingConfiguration);
    if (err != nil) {
      fmt.Println("Persistance: failed to parse booking config file", err);
    } else {
      fmt.Println("Persistance: booking config is read");
    }
  } else {
    fmt.Println("Persistance: failed to read booking config", err);
  }
}

func readGeneralParams() {
  paramsByteArray, err := ioutil.ReadFile(RuntimeRoot + "/" + GENERAL_PARAMS_FILE_NAME);
  if (err == nil) {
    generalParams = &TGeneralParams{};
    err := json.Unmarshal(paramsByteArray, generalParams);
    if (err != nil) {
      fmt.Println("Persistance: failed to parse general params file", err);
    } else {
      fmt.Println("Persistance: general params are read");
    }
  } else {
    fmt.Println("Persistance: failed to read general params", err);
  }
}
