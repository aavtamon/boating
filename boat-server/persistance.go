package main

import "fmt"
import "io/ioutil"
import "encoding/json"
import "time"
import "sync"
import "strings"
import "os";
import "log";
import "strconv";

import "database/sql";
import _"github.com/go-sql-driver/mysql";



var database *sql.DB;


func initializeDatabase() {
  db, err := sql.Open("mysql", GetSystemConfiguration().PersistenceDb.Username + ":" + GetSystemConfiguration().PersistenceDb.Password + "@/" + GetSystemConfiguration().PersistenceDb.Database);
  if (err != nil) {
    log.Fatal("Persistence: Cannot initialize database", err);
  } else {
    fmt.Println("Persistence: database connection successful");
    database = db;
  }


  database.Exec("CREATE TABLE IF NOT EXISTS reservations(" +
                "id VARCHAR(20) PRIMARY KEY," +
                "owner_account_id VARCHAR(255)," +
                "timestamp BIGINT NOT NULL," +
                "location_id VARCHAR(255) NOT NULL," +
                "boat_id VARCHAR(255) NOT NULL," +
                "booking_slot_datetime BIGINT NOT NULL," +
                "booking_slot_duration TINYINT NOT NULL," +
                "booking_slot_price FLOAT NOT NULL," +
                "pickup_location_id VARCHAR(255)," +
                "num_of_adults TINYINT," +
                "num_of_children TINYINT," +
                "extras VARCHAR(255)," +
                "dl_state VARCHAR(20)," +
                "dl_number VARCHAR(20)," +
                "first_name VARCHAR(255)," +
                "last_name VARCHAR(255)," +
                "email VARCHAR(255)," +
                "primary_phone VARCHAR(255)," +
                "alternative_phone VARCHAR(255)," +
                "payment_status VARCHAR(20)," +
                "payment_amount FLOAT," +
                "refund_amount FLOAT," +
                "charge_id VARCHAR(255)," +
                "refund_id VARCHAR(255)," +
                "deposit_charge_id VARCHAR(255)," +
                "deposit_refund_id VARCHAR(255)," +
                "deposit_amount FLOAT," +
                "deposit_status VARCHAR(20)," +
                "fuel_usage TINYINT," +
                "fuel_charge FLOAT," +
                "delay INT," +
                "late_fee FLOAT," +
                "promo_code VARCHAR(255)," +
                "notes TEXT," +
                "additional_drivers VARCHAR(255)," +
                "status VARCHAR(20) NOT NULL" +
                ")");

  database.Exec("CREATE TABLE IF NOT EXISTS safety_tests(" +
                "suite_id VARCHAR(20) PRIMARY KEY," +
                "score TINYINT NOT NULL," +
                "first_name VARCHAR(255) NOT NULL," +
                "last_name VARCHAR(255) NOT NULL," +
                "dl_state VARCHAR(20) NOT NULL," +
                "dl_number VARCHAR(20) NOT NULL," +
                "pass_date BIGINT NOT NULL," +
                "expiration_date BIGINT NOT NULL" +
                ")");
          
/*   
 TBD - should it be moved to the database as well?
 
  database.Exec("CREATE TABLE IF NOT EXISTS accounts(" +
                "id VARCHAR(20) PRIMARY KEY," +
                "owner_account_type VARCHAR(20) NOT NULL," +
                "username VARCHAR(255) NOT NULL," +
                "token VARCHAR(255) NOT NULL," +
                "first_name VARCHAR(255) NOT NULL," +
                "last_name VARCHAR(255) NOT NULL," +
                "email VARCHAR(255) NOT NULL," +
                "primary_phone VARCHAR(255) NOT NULL," +
                "locations VARCHAR(255) NOT NULL" +
                ")");
*/


// TEMPORARY

  for _, reservation := range persistenceDb.Reservations {
    var extras string = "";
    for id, included := range reservation.Extras {
      if (included) {
        if (extras != "") {
          extras += ",";
        }
        extras += id;
      }
    }
    
    var drivers string = "";
    for _, dl := range reservation.AdditionalDrivers {
      if (drivers != "") {
        drivers += ",";
      }
      drivers += dl;
    }
    
    
  
    database.Exec("INSERT INTO reservations(id, owner_account_id, timestamp, location_id, boat_id, booking_slot_datetime, booking_slot_duration, booking_slot_price, pickup_location_id, num_of_adults, num_of_children, extras, dl_state, dl_number, first_name, last_name, email, primary_phone, alternative_phone, payment_status, payment_amount, refund_amount, charge_id, refund_id, deposit_charge_id, deposit_refund_id, deposit_amount, deposit_status, fuel_usage, fuel_charge, delay, late_fee, promo_code, notes, additional_drivers, status) VALUES ('" + string(reservation.Id) + "','" + string(reservation.OwnerAccountId) + "'," + strconv.FormatInt(reservation.Timestamp, 10) + ",'" + reservation.LocationId + "','" + reservation.BoatId + "'," + strconv.FormatInt(reservation.Slot.DateTime, 10) + "," + strconv.Itoa(reservation.Slot.Duration) + "," + strconv.FormatFloat(reservation.Slot.Price, 'E', 2, 32) + ",'" + reservation.PickupLocationId + "'," + strconv.Itoa(reservation.NumOfAdults) + "," + strconv.Itoa(reservation.NumOfChildren) + ",'" + extras + "','" + reservation.DLState + "','" + reservation.DLNumber + "','" + reservation.FirstName + "','" + reservation.LastName + "','" + reservation.Email + "','" + reservation.PrimaryPhone + "','" + reservation.AlternativePhone + "','" + string(reservation.PaymentStatus) + "'," + strconv.FormatFloat(reservation.PaymentAmount, 'E', 2, 32) + "," + strconv.FormatFloat(reservation.RefundAmount, 'E', 2, 32) + ",'" + reservation.ChargeId + "','" + reservation.RefundId + "','" + reservation.DepositChargeId + "','" + reservation.DepositRefundId + "'," + strconv.FormatFloat(reservation.DepositAmount, 'E', 2, 32) + ",'" + string(reservation.DepositStatus) + "'," + strconv.Itoa(reservation.FuelUsage) + "," + strconv.FormatFloat(reservation.FuelCharge, 'E', 2, 32) + "," + strconv.Itoa(reservation.Delay) + "," + strconv.FormatFloat(reservation.LateFee, 'E', 2, 32) + ",'" + reservation.PromoCode + "','" + reservation.Notes + "','" + drivers + "','" + string(reservation.Status) + "')");
  }
  
  
  for _, testResult := range persistenceDb.SafetyTestResults {
    database.Exec("INSERT INTO safety_tests(suite_id, score, first_name, last_name, dl_state, dl_number, pass_date, expiration_date) VALUES ('" + string(testResult.SuiteId) + "', " + strconv.Itoa(testResult.Score) + ", '" + testResult.FirstName + "', '" + testResult.LastName + "', '"  + testResult.DLState + "', '" + testResult.DLNumber + "', " + strconv.FormatInt(testResult.PassDate, 10) + ", " + strconv.FormatInt(testResult.ExpirationDate, 10) + ")");
  }
}



type TOwnerAccountMap map[TOwnerAccountId]*TOwnerAccount;



type TPersistenceDatabase struct {
  SafetyTestResults TSafetyTestResults `json:"safety_test_results"`;
  Reservations TReservations `json:"reservations"`;
}




var ownerAccountMap TOwnerAccountMap;
var persistenceDb TPersistenceDatabase;

var accessLock sync.Mutex;

func InitializePersistance() {
  readOwnerAccountDatabase();
  readPersistenceDatabase();
  
  InitializeBookings();
  
  schedulePeriodicCleanup();
  
  initializeDatabase();
  
/*
  selDB, err := database.Query("SELECT * FROM test");
  if (err != nil) {
  log.Fatal("Persistence: failed to read = ", err);
  } else {
    for selDB.Next() {
      var id int;
      var name string
      err = selDB.Scan(&id, &name);
      if (err == nil) {
        fmt.Println("Persistence: read %@, %@", id, name);
      }
    }
  }
*/  
}


func GetReservation(reservationId TReservationId) *TReservation {
  selDB, _ := database.Query("SELECT * FROM reservations WHERE id='" + string(reservationId)+ "'");

  if (selDB.Next()) {
    var extras string;
    var drivers string;
  
    reservation := new(TReservation);
    selDB.Scan(&reservation.Id, &reservation.OwnerAccountId, &reservation.Timestamp, &reservation.LocationId, &reservation.BoatId, &reservation.Slot.DateTime, &reservation.Slot.Duration, &reservation.Slot.Price, &reservation.PickupLocationId, &reservation.NumOfAdults, &reservation.NumOfChildren, &extras, &reservation.DLState, &reservation.DLNumber, &reservation.FirstName, &reservation.LastName, &reservation.Email, &reservation.PrimaryPhone, &reservation.AlternativePhone, &reservation.PaymentStatus, &reservation.PaymentAmount, &reservation.RefundAmount, &reservation.ChargeId, &reservation.RefundId, &reservation.DepositChargeId, &reservation.DepositRefundId, &reservation.DepositAmount, &reservation.DepositStatus, &reservation.FuelUsage, &reservation.FuelCharge, &reservation.Delay, &reservation.LateFee, &reservation.PromoCode, &reservation.Notes, &drivers, &reservation.Status);
    
    reservation.Extras = make(map[string]bool);
    if (len(extras) > 0) {
      for _, extraItem := range strings.Split(extras, ",") {
        reservation.Extras[extraItem] = true;
      }
    }
    
    reservation.AdditionalDrivers = strings.Split(drivers, ",");
  }
  
  return nil;
}



func GetAllReservations() TReservations {
  result := make(TReservations);
  
  for reservationId, reservation := range persistenceDb.Reservations {
    if (reservation.isActive()) {
      result[reservationId] = reservation;
    }
  }
  
  return result;
}


func SaveReservation(reservation *TReservation) {
  fmt.Printf("Persistance: saving reservation %s\n", reservation.Id);
  
  accessLock.Lock();
  persistenceDb.Reservations[reservation.Id] = reservation;
  
    
  savePersistenceDatabase();
  accessLock.Unlock();
}

func FindSafetyTestResults(reservation *TReservation) TSafetyTestResults {
  if (reservation == nil) {
    return nil;
  }

  results := make(TSafetyTestResults);
  
  primaryDlId := reservation.DLState + "-" + reservation.DLNumber;
  primaryResult := persistenceDb.SafetyTestResults[primaryDlId];
  if (primaryResult != nil && primaryResult.ExpirationDate > reservation.Slot.DateTime) {
    results[primaryDlId] = primaryResult;
  }
  
  for _,dlId := range reservation.AdditionalDrivers {
    additionalResult := persistenceDb.SafetyTestResults[dlId];
    if (additionalResult != nil && additionalResult.ExpirationDate > reservation.Slot.DateTime) {
      results[dlId] = additionalResult;
    }
  }
  
  return results;
}

func SaveSafetyTestResult(testResult *TSafetyTestResult) {
  dlId := testResult.DLState + "-" + testResult.DLNumber;
  fmt.Printf("Persistance: saving safety test result for dl %s\n", dlId);
  
  accessLock.Lock();
  persistenceDb.SafetyTestResults[dlId] = testResult;
  
  savePersistenceDatabase();
  accessLock.Unlock();
}



func GetOwnerAccount(accountId TOwnerAccountId) *TOwnerAccount {
  ownerAccount := ownerAccountMap[accountId];
  if (ownerAccount == nil) {
    return nil;
  }
  
  ownerAccount.Id = accountId;
  
  return ownerAccount;
}



func readPersistenceDatabase() {
  databaseByteArray, err := ioutil.ReadFile(RuntimeRoot + "/persistence_db.json");
  if (err == nil) {
    err := json.Unmarshal(databaseByteArray, &persistenceDb);
    if (err != nil) {
      fmt.Println("Persistance: failed to dersereialize reservation database - initializing: ", err);
    } else {
      fmt.Println("Persistance: reservation database is read");
    }
  } else {
    fmt.Println("Persistance: failed to read reservation database - initializing: ", err);
  }
  
  if (persistenceDb.Reservations == nil) {
    persistenceDb.Reservations = make(TReservations);
    persistenceDb.SafetyTestResults = make(TSafetyTestResults);
  }
  
  savePersistenceDatabase();
}

func savePersistenceDatabase() {
  cleanObsoleteReservations();
  cleanObsoleteSafetyTestResults();
  
  persistentDbPath := RuntimeRoot + "/persistence_db.json";
  
  // First, create a backup copy
  dbContent, err := ioutil.ReadFile(persistentDbPath);
  if (err == nil) {
    backupFile := GetSystemConfiguration().PersistenceDb.BackupPath + "/" + strconv.FormatInt(time.Now().UTC().Unix(), 10);
    err = ioutil.WriteFile(backupFile, dbContent, 0644);
    if (err != nil) {
      fmt.Println("Persistance: failed to create a backup copy: ", err);
    }
  } else {
    fmt.Println("Persistance: failed to read persistence db - skipping backup: ", err);
  }
  
  // Next, check if we need to remove the oldest file
  backupFiles, err := ioutil.ReadDir(GetSystemConfiguration().PersistenceDb.BackupPath);
  if (err != nil) {
    fmt.Println("Persistance: failed to enumerate backup files: ", err);
  } else {
    if (len(backupFiles) > GetSystemConfiguration().PersistenceDb.BackupQuantity) {
      //sort.Strings(backupFiles);
      err = os.Remove(GetSystemConfiguration().PersistenceDb.BackupPath + "/" + backupFiles[0].Name());
      if (err != nil) {
        fmt.Println("Persistance: failed to remove the olderst backup file: ", err);
      }
    }
  }
  
  // Finally, save to / overwrite the persistence db
  databaseByteArray, err := json.MarshalIndent(persistenceDb, "", "  ");
  if (err == nil) {
    err = ioutil.WriteFile(persistentDbPath, databaseByteArray, 0644);
    if (err != nil) {
      fmt.Println("Persistance: failed to save reservation database to file: ", err);
    } else {
      fmt.Println("Persistance: saving database");
    }
  } else {
    fmt.Println("Persistance: failed to serialize reservation database: ", err);
  }
}

func cleanObsoleteReservations() {
  currentMoment := time.Now().UTC().Unix();

  for reservationId, reservation := range persistenceDb.Reservations {
  
    // Boat owners reservations become completed automatically as they pass
    if (reservation.Status == RESERVATION_STATUS_BOOKED && reservation.OwnerAccountId != NO_OWNER_ACCOUNT_ID) {
      if (reservation.Slot.DateTime / int64(time.Second / time.Millisecond) + 60 * 60 * 24 < currentMoment) {
        reservation.Status = RESERVATION_STATUS_COMPLETED;
      }
    } else if (reservation.Status == RESERVATION_STATUS_CANCELLED) {
      expiration := systemConfiguration.BookingExpirationConfiguration.CancelledTimeout;
      if (reservation.Timestamp + expiration * 60 * 60 * 24 < currentMoment) {
        delete(persistenceDb.Reservations, reservationId);
      }
    } else if (reservation.Status == RESERVATION_STATUS_COMPLETED) {
      expiration := systemConfiguration.BookingExpirationConfiguration.CompletedTimeout;
      if (reservation.Timestamp + expiration * 60 * 60 * 24 < currentMoment) {
        reservation.archive();
      }
    } else if (reservation.Status == RESERVATION_STATUS_ARCHIVED) {
      expiration := systemConfiguration.BookingExpirationConfiguration.ArchivedTimeout;
      if (reservation.Timestamp + expiration * 60 * 60 * 24 < currentMoment) {
        delete(persistenceDb.Reservations, reservationId);  
      }
    }
  }
}

func cleanObsoleteSafetyTestResults() {
  currentMoment := time.Now().UTC().Unix();

  for dlId, testResult := range persistenceDb.SafetyTestResults {
    if (testResult.ExpirationDate + systemConfiguration.SafetyTestHoldTime * 60 * 60 * 24 < currentMoment) {
      delete(persistenceDb.SafetyTestResults, dlId);
    }
  }
}


func readOwnerAccountDatabase() {
  databaseByteArray, err := ioutil.ReadFile(RuntimeRoot + "/" + GetSystemConfiguration().PersistenceDb.AccountDatabase);
  if (err == nil) {
    err := json.Unmarshal(databaseByteArray, &ownerAccountMap);
    if (err != nil) {
      fmt.Println("Persistance: failed to dersereialize account database - initializing", err);
    } else {
      fmt.Println("Persistance: account database is read");    
    }
  } else {
    fmt.Println("Persistance: failed to read account database - initializing", err);
  }
  
  if (ownerAccountMap == nil) {
    ownerAccountMap = make(TOwnerAccountMap);
  }
}




func findMatchingAccounts(locationId string, boatId string) []*TOwnerAccount {
  result := []*TOwnerAccount{};

  for _, account := range ownerAccountMap {
    boatIds, hasLocation := account.Locations[locationId];
    if (hasLocation) {
      if (len(boatIds.Boats) == 0 && account.Type == OWNER_ACCOUNT_TYPE_ADMIN) {
        result = append(result, account);
      } else {
        for _, id := range boatIds.Boats {
          if (id == boatId) {
            result = append(result, account);
          }
        }
      }
    } else if (account.Type == OWNER_ACCOUNT_TYPE_ADMIN) {
      result = append(result, account);
    }
  }
  
  return result;
}

func GetOwnerReservationSummaries(ownerAccountId TOwnerAccountId) []*TReservationSummary {
  reservationSummaries := []*TReservationSummary{};

  if (ownerAccountId != NO_OWNER_ACCOUNT_ID) {
    for _, reservation := range persistenceDb.Reservations {
      if (reservation.OwnerAccountId == ownerAccountId && reservation.isActive()) {
        reservationSummaries = append(reservationSummaries, getReservationSummary(reservation));
      }
    }
  }

  return reservationSummaries;
}

func getReservationSummary(reservation *TReservation) *TReservationSummary {
  return &TReservationSummary{
    Id: reservation.Id,
    Slot: reservation.Slot,
  };
}


func GetOwnerRentalStat(accountId TOwnerAccountId) *TRentalStat {
  if (accountId == NO_OWNER_ACCOUNT_ID) {
    return nil;
  }

  account := ownerAccountMap[accountId];
  
  rentalStat := &TRentalStat{};
  rentalStat.Rentals = make(map[TReservationId]*TRental);
  
  for _, reservation := range persistenceDb.Reservations {
    if (reservation.Status == RESERVATION_STATUS_CANCELLED) {
      continue;
    }
  
    if (reservation.OwnerAccountId == NO_OWNER_ACCOUNT_ID) {
      boatIds, hasLocation := account.Locations[reservation.LocationId];
      if (hasLocation) {
        matches := false;
        if (len(boatIds.Boats) == 0 && account.Type == OWNER_ACCOUNT_TYPE_ADMIN) {
          matches = true;
        } else if (len(boatIds.Boats) > 0) {
          for _, boatId := range boatIds.Boats {
            if (boatId == reservation.BoatId) {
              matches = true;
              break;
            }
          }
        }

        if (matches) {
          rentalStat.Rentals[reservation.Id] = &TRental{};

          rentalStat.Rentals[reservation.Id].LocationId = reservation.LocationId;
          rentalStat.Rentals[reservation.Id].BoatId = reservation.BoatId;
          rentalStat.Rentals[reservation.Id].Slot = reservation.Slot;
          rentalStat.Rentals[reservation.Id].LastName = reservation.LastName;
          rentalStat.Rentals[reservation.Id].SafetyTestStatus = len(FindSafetyTestResults(reservation)) > 0;
          rentalStat.Rentals[reservation.Id].PaymentAmount = reservation.PaymentAmount;
          rentalStat.Rentals[reservation.Id].Status = reservation.Status;
        }
      }
    }
  }
  
  return rentalStat;
}


func GetUsageStats(accountId TOwnerAccountId) *TUsageStats {
  if (accountId == NO_OWNER_ACCOUNT_ID) {
    return nil;
  }

  account := ownerAccountMap[accountId];
  
  currentTime := time.Now().UTC();
  
  usageStat := &TUsageStats{};
  usageStat.BoatUsageStats = make(map[string]*TBoatUsageStat);
  usageStat.Periods = []string{};
  
  
  //Build periods first - 12 last months
  for month := currentTime.Month(); month <= time.December; month++ {
    usageStat.Periods = append(usageStat.Periods, getPeriod(currentTime.Year() - 1, month));
  }
  for month := time.January; month <= currentTime.Month(); month++ {
    usageStat.Periods = append(usageStat.Periods, getPeriod(currentTime.Year(), month));
  }
  
  
  
  for _, reservation := range persistenceDb.Reservations {
    if (reservation.Status == RESERVATION_STATUS_CANCELLED) {
      continue;
    }
    
    boatIds, hasLocation := account.Locations[reservation.LocationId];
    if (hasLocation) {
      matches := false;
      if (len(boatIds.Boats) == 0 && account.Type == OWNER_ACCOUNT_TYPE_ADMIN) {
        matches = true;
      } else if (len(boatIds.Boats) > 0) {
        for _, boatId := range boatIds.Boats {
          if (boatId == reservation.BoatId) {
            matches = true;
            break;
          }
        }
      }

      if (matches) {
        reservationTime := time.Unix(0, reservation.Slot.DateTime * int64(time.Millisecond));

        usageId := reservation.LocationId + "-" + reservation.BoatId;
        boatUsageStat, hasStat := usageStat.BoatUsageStats[usageId];
        if (!hasStat) {
          boatUsageStat = &TBoatUsageStat{};
          boatUsageStat.LocationId = reservation.LocationId;
          boatUsageStat.BoatId = reservation.BoatId;
          boatUsageStat.Hours = make([]int, len(usageStat.Periods));

          usageStat.BoatUsageStats[usageId] = boatUsageStat;
        }

        reservationPeriod := getPeriod(reservationTime.Year(), reservationTime.Month());
        foundPeriodIndex := -1;
        for periodIndex, period := range usageStat.Periods {
          if (period == reservationPeriod) {
            foundPeriodIndex = periodIndex;
            break;
          }
        }

        if (foundPeriodIndex >= 0) {
          boatUsageStat.Hours[foundPeriodIndex] += reservation.Slot.Duration;
        }
      }
    }
  }
  
  return usageStat;
}

func getPeriod(year int, month time.Month) string {
  return month.String()[:3] + "'" + strconv.Itoa(year)[2:];
}


func schedulePeriodicCleanup() {
  go func() {
    // Delay periodic action until 3am next day
    initialDelayMins := 60 - time.Now().Minute();
    initialDelayHours := 24 - time.Now().Hour() + 3;
    
    time.Sleep(time.Duration(initialDelayMins) * time.Minute + time.Duration(initialDelayHours) * time.Hour);
    fmt.Println("Persistance: periodic database adjustment. Starting 24-hour sequence now: ", time.Now().String());
    
    // Start action every 24 hours
    tickChannel := time.Tick(time.Duration(24) * time.Hour);
    for now := range tickChannel {
      fmt.Println("Persistance: periodic database saving at ", now.String());
      savePersistenceDatabase();
    }
  }();
}
