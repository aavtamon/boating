package main

import "fmt"
import "io/ioutil"
import "os"
import "encoding/json"
import "time"
import "strings"
import "log";
import "strconv";

import "database/sql";
import _"github.com/go-sql-driver/mysql";
import "github.com/JamesStewy/go-mysqldump";



var database *sql.DB;
var dumper *mysqldump.Dumper;

var ownerAccounts map[TOwnerAccountId]*TOwnerAccount;
var activeReservations TReservations;



func initializeDatabase() {
  db, err := sql.Open("mysql", GetSystemConfiguration().PersistenceDb.Username + ":" + GetSystemConfiguration().PersistenceDb.Password + "@/" + GetSystemConfiguration().PersistenceDb.Database);
  if (err != nil) {
    log.Fatal("Persistence: Cannot initialize database ", err);
  } else {
    fmt.Println("Persistence: database connection successful");
    database = db;
  }
  
  dumper, err = mysqldump.Register(database, GetSystemConfiguration().PersistenceDb.BackupPath, time.ANSIC);
  if (err != nil) {
    fmt.Println("Persistence: database backup failed to initialize ", err);
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
                "id VARCHAR(20) PRIMARY KEY," +
                "suite_id VARCHAR(20) NOT NULL," +
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


/*
// TEMPORARY
  type TPersistenceDatabase struct {
    SafetyTestResults TSafetyTestResults `json:"safety_test_results"`;
    Reservations TReservations `json:"reservations"`;
  }

  var persistenceDb TPersistenceDatabase;
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


  for _, reservation := range persistenceDb.Reservations {
    SaveReservation(reservation);
  }
  for _, testResult := range persistenceDb.SafetyTestResults {
    testResult.Id = testResult.DLState + "-" + testResult.DLNumber;
    SaveSafetyTestResult(testResult);
  }
  
// END OF TEMPORARY
*/
}




func InitializePersistance() {
  readOwnerAccountDatabase();
  initializeDatabase();
  
  InitializeBookings();
  
  schedulePeriodicCleanup();
}


func GetActiveReservation(reservationId TReservationId) *TReservation {
  if (reservationId == NO_RESERVATION_ID) {
    return nil;
  }

  return findActiveReservations("id='" + string(reservationId)+ "'")[reservationId];
}

func GetActiveReservations() TReservations {
  if (activeReservations == nil) {
    activeReservations = findActiveReservations("");
  }
  return activeReservations;
}

func SaveReservation(reservation *TReservation) {
  fmt.Printf("Persistance: saving reservation %s\n", reservation.Id);
  
  activeReservations = nil; // reset cache
  
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
  
  database.Exec("DELETE FROM reservations WHERE id='" + string(reservation.Id) + "'");

  database.Exec("INSERT INTO reservations(id, owner_account_id, timestamp, location_id, boat_id, booking_slot_datetime, booking_slot_duration, booking_slot_price, pickup_location_id, num_of_adults, num_of_children, extras, dl_state, dl_number, first_name, last_name, email, primary_phone, alternative_phone, payment_status, payment_amount, refund_amount, charge_id, refund_id, deposit_charge_id, deposit_refund_id, deposit_amount, deposit_status, fuel_usage, fuel_charge, delay, late_fee, promo_code, notes, additional_drivers, status) VALUES ('" + string(reservation.Id) + "','" + string(reservation.OwnerAccountId) + "'," + strconv.FormatInt(reservation.Timestamp, 10) + ",'" + reservation.LocationId + "','" + reservation.BoatId + "'," + strconv.FormatInt(reservation.Slot.DateTime, 10) + "," + strconv.Itoa(reservation.Slot.Duration) + "," + strconv.FormatFloat(reservation.Slot.Price, 'E', 2, 32) + ",'" + reservation.PickupLocationId + "'," + strconv.Itoa(reservation.NumOfAdults) + "," + strconv.Itoa(reservation.NumOfChildren) + ",'" + extras + "','" + reservation.DLState + "','" + reservation.DLNumber + "','" + reservation.FirstName + "','" + reservation.LastName + "','" + reservation.Email + "','" + reservation.PrimaryPhone + "','" + reservation.AlternativePhone + "','" + string(reservation.PaymentStatus) + "'," + strconv.FormatFloat(reservation.PaymentAmount, 'E', 2, 32) + "," + strconv.FormatFloat(reservation.RefundAmount, 'E', 2, 32) + ",'" + reservation.ChargeId + "','" + reservation.RefundId + "','" + reservation.DepositChargeId + "','" + reservation.DepositRefundId + "'," + strconv.FormatFloat(reservation.DepositAmount, 'E', 2, 32) + ",'" + string(reservation.DepositStatus) + "'," + strconv.Itoa(reservation.FuelUsage) + "," + strconv.FormatFloat(reservation.FuelCharge, 'E', 2, 32) + "," + strconv.Itoa(reservation.Delay) + "," + strconv.FormatFloat(reservation.LateFee, 'E', 2, 32) + ",'" + reservation.PromoCode + "','" + reservation.Notes + "','" + drivers + "','" + string(reservation.Status) + "')");  
  
  cleanPersistenceDatabase();
}


func GetSafetyTestResults(reservation *TReservation) TSafetyTestResults {
  if (reservation == nil) {
    return nil;
  }

  searchCriteria := "expiration_date > " + strconv.FormatInt(reservation.Slot.DateTime, 10) + " AND (dl_state='" + reservation.DLState + "' AND dl_number='" + reservation.DLNumber + "'";
  for _,dlId := range reservation.AdditionalDrivers {
    searchCriteria += " OR id='" + dlId + "'";
  }
  searchCriteria += ")";
  
  selDB, _ := database.Query("SELECT * FROM safety_tests WHERE " + searchCriteria);

  testResults := make(TSafetyTestResults);
  for selDB.Next() {
    testResult := new(TSafetyTestResult);
    selDB.Scan(&testResult.Id, &testResult.SuiteId, &testResult.Score, &testResult.FirstName, &testResult.LastName, &testResult.DLState, &testResult.DLNumber, &testResult.PassDate, &testResult.ExpirationDate);
    
    testResults[testResult.Id] = testResult;
  }

  return testResults;  
}

func SaveSafetyTestResult(testResult *TSafetyTestResult) {
  fmt.Printf("Persistance: saving safety test result for dl %s\n", testResult.Id);
  
  database.Exec("DELETE FROM safety_tests WHERE id='" + testResult.Id + "'");
  
  database.Exec("INSERT INTO safety_tests(id, suite_id, score, first_name, last_name, dl_state, dl_number, pass_date, expiration_date) VALUES ('" + testResult.Id + "', '" + string(testResult.SuiteId) + "', " + strconv.Itoa(testResult.Score) + ", '" + testResult.FirstName + "', '" + testResult.LastName + "', '"  + testResult.DLState + "', '" + testResult.DLNumber + "', " + strconv.FormatInt(testResult.PassDate, 10) + ", " + strconv.FormatInt(testResult.ExpirationDate, 10) + ")");
  
  cleanPersistenceDatabase();
}


func GetOwnerAccount(accountId TOwnerAccountId) *TOwnerAccount {
  ownerAccount := ownerAccounts[accountId];
  if (ownerAccount == nil) {
    return nil;
  }
  
  ownerAccount.Id = accountId;
  
  return ownerAccount;
}


func GetOwnerReservationSummaries(ownerAccountId TOwnerAccountId) []*TReservationSummary {
  reservationSummaries := []*TReservationSummary{};

  if (ownerAccountId != NO_OWNER_ACCOUNT_ID) {
    reservations := findActiveReservations("owner_account_id='" + string(ownerAccountId) + "'");
  
    for _, reservation := range reservations {
      reservationSummaries = append(reservationSummaries, &TReservationSummary{Id: reservation.Id, Slot: reservation.Slot,});
    }
  }

  return reservationSummaries;
}


func GetOwnerRentalStat(accountId TOwnerAccountId) *TRentalStat {
  if (accountId == NO_OWNER_ACCOUNT_ID) {
    return nil;
  }

  account := ownerAccounts[accountId];
  
  rentalStat := &TRentalStat{};
  rentalStat.Rentals = make(map[TReservationId]*TRental);
  
  reservations := findReservations("status<>'" + string(RESERVATION_STATUS_CANCELLED) + "' AND owner_account_id=''");
  for _, reservation := range reservations {
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
        rentalStat.Rentals[reservation.Id].SafetyTestStatus = len(GetSafetyTestResults(reservation)) > 0;
        rentalStat.Rentals[reservation.Id].PaymentAmount = reservation.PaymentAmount;
        rentalStat.Rentals[reservation.Id].Status = reservation.Status;
      }
    }
  }
  
  return rentalStat;
}


func GetUsageStats(accountId TOwnerAccountId) *TUsageStats {
  if (accountId == NO_OWNER_ACCOUNT_ID) {
    return nil;
  }

  account := ownerAccounts[accountId];
  
  currentTime := time.Now().UTC();
  
  usageStat := &TUsageStats{};
  usageStat.BoatUsageStats = make(map[string]*TBoatUsageStat);
  usageStat.Periods = []string{};
  
  
  //Build period of the last 12 months
  for month := currentTime.Month(); month <= time.December; month++ {
    usageStat.Periods = append(usageStat.Periods, getPeriod(currentTime.Year() - 1, month));
  }
  for month := time.January; month <= currentTime.Month(); month++ {
    usageStat.Periods = append(usageStat.Periods, getPeriod(currentTime.Year(), month));
  }
  
  reservations := findReservations("status<>'" + string(RESERVATION_STATUS_CANCELLED) + "' AND booking_slot_datetime>" + strconv.FormatInt((currentTime.Unix() - 400 * 24 * 60 * 60) * int64(time.Second / time.Millisecond), 10));
  for _, reservation := range reservations {
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






func findReservations(searchCriteria string) TReservations {
  selDB, _ := database.Query("SELECT * FROM reservations WHERE " + searchCriteria);

  reservations := make(TReservations);
  for selDB.Next() {
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
    
    reservations[reservation.Id] = reservation;
  }

  return reservations;
}

func findActiveReservations(additionalSearchCriteria string) TReservations {
  searchCriteria := "status<>'" + string(RESERVATION_STATUS_CANCELLED) + "' AND status<>'" + string(RESERVATION_STATUS_COMPLETED) + "' AND status<>'" + string(RESERVATION_STATUS_ARCHIVED) + "'";
  
  if (additionalSearchCriteria != "") {
    searchCriteria += " AND " + additionalSearchCriteria;
  }

  return findReservations(searchCriteria);
}

  




func cleanPersistenceDatabase() {
  cleanObsoleteReservations();
  cleanObsoleteSafetyTestResults();
}


func cleanObsoleteReservations() {
  activeReservations = nil; // reset cache 

  currentMoment := time.Now().UTC().Unix();

  //database.Query("UPDATE reservations SET status =  WHERE " + searchCriteria);
  
  // Boat owners reservations become completed automatically as they pass
  reservations := findReservations("owner_account_id<>'' AND status='" + string(RESERVATION_STATUS_BOOKED) + "' AND booking_slot_datetime<" + strconv.FormatInt((currentMoment - 60 * 60 * 24) * int64(time.Second / time.Millisecond), 10));
  for _, reservation := range reservations {
    reservation.Status = RESERVATION_STATUS_COMPLETED;
    reservation.save();
  }

  // Completed reservations are eventually archived
  reservations = findReservations("status='" + string(RESERVATION_STATUS_COMPLETED) + "' AND timestamp < " + strconv.FormatInt((currentMoment - 60 * 60 * 24 * systemConfiguration.BookingExpirationConfiguration.CompletedTimeout), 10));
  for _, reservation := range reservations {
    reservation.archive();
  }

  // Cancelled reservations are eventually removed
  //reservations = findReservations("status='" + string(RESERVATION_STATUS_CANCELLED) + "' AND timestamp < " + //strconv.FormatInt((currentMoment - 60 * 60 * 24 * systemConfiguration.BookingExpirationConfiguration.CancelledTimeout), 10));
  //for reservationId, _ := range reservations {
  //  database.Query("DELETE FROM reservations WHERE id='" + string(reservationId) + "'");
  //}

  // Archived reservations are eventually removed
  //reservations = findReservations("status='" + string(RESERVATION_STATUS_CANCELLED) + "' AND timestamp < " + //strconv.FormatInt((currentMoment - 60 * 60 * 24 * systemConfiguration.BookingExpirationConfiguration.ArchivedTimeout), 10));
  //for reservationId, _ := range reservations {
  //  database.Query("DELETE FROM reservations WHERE id='" + string(reservationId) + "'");
  //}
}

func cleanObsoleteSafetyTestResults() {
  currentMoment := time.Now().UTC().Unix();
  
  database.Exec("DELETE FROM safety_tests WHERE expiration_date<" + strconv.FormatInt(currentMoment - systemConfiguration.SafetyTestHoldTime * 60 * 60 * 24, 10));
}


func readOwnerAccountDatabase() {
  databaseByteArray, err := ioutil.ReadFile(RuntimeRoot + "/" + GetSystemConfiguration().PersistenceDb.AccountDatabase);
  if (err == nil) {
    err := json.Unmarshal(databaseByteArray, &ownerAccounts);
    if (err != nil) {
      fmt.Println("Persistance: failed to dersereialize account database - initializing", err);
    } else {
      fmt.Println("Persistance: account database is read");    
    }
  } else {
    fmt.Println("Persistance: failed to read account database - initializing", err);
  }
  
  if (ownerAccounts == nil) {
    ownerAccounts = make(map[TOwnerAccountId]*TOwnerAccount);
  }
}

func findMatchingAccounts(locationId string, boatId string) []*TOwnerAccount {
  result := []*TOwnerAccount{};

  for _, account := range ownerAccounts {
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



func getPeriod(year int, month time.Month) string {
  return month.String()[:3] + "'" + strconv.Itoa(year)[2:];
}


func schedulePeriodicCleanup() {
  go func() {
    // Delay periodic action until 3am next day
    initialDelayMins := 60 - time.Now().Minute();
    initialDelayHours := 24 - time.Now().Hour() + 3;
    
    time.Sleep(time.Duration(initialDelayMins) * time.Minute + time.Duration(initialDelayHours) * time.Hour);
    fmt.Println("Persistance: periodic database cleanup time adjustment. Starting 24-hour sequence now: ", time.Now().String());
    
    // Start action every 24 hours
    tickChannel := time.Tick(time.Duration(24) * time.Hour);
    for now := range tickChannel {
      fmt.Println("Persistance: periodic database cleanup and backup at ", now.String());
      cleanPersistenceDatabase();
      backupDatabase();
    }
  }();
}


func backupDatabase() {
  backupFile, err := dumper.Dump();
  if (err != nil) {
    fmt.Println("Persistance: failed to backup database ", err);
    return;
  } else {
    fmt.Println("Persistance: database backup saved to ", backupFile);
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
}
