package main

import "net/http"
import "encoding/json"
import "fmt"
import "io"
import "io/ioutil"
import "time"
import "strings"



type TSafetyTestResult struct {
  SuiteId TSafetySuiteId `json:"suite_id"`;
  Score int `json:"score"`;
  FirstName string `json:"first_name"`;
  LastName string `json:"last_name"`;
  DLState string `json:"dl_state"`;
  DLNumber string `json:"dl_number"`;
  PassDate int64 `json:"pass_date"`;
  ExpirationDate int64 `json:"expiration_date"`;
}

type TSafetyTestResults map[string]*TSafetyTestResult;


type TSafetyTest struct {
  Text string `json:"text"`;
  OptionsFormat string `json:"options_format"`;
  Options map[string]string `json:"options"`;
  AnswerOptionId string `json:"answer_option_id"`;
  Status bool `json:"status"`;
}

type TSafetySuiteId string;

type TSafetyTestSuite struct {
  PassingGrade int `json:"passing_grade"`;
  ValidityPeriod int `json:"validity_period"`;
  Tests map[string]*TSafetyTest `json:"tests"`;
}

type TCompletedSafetySuite struct {
  FirstName string `json:"first_name"`;
  LastName string `json:"last_name"`;
  DLState string `json:"dl_state"`;
  DLNumber string `json:"dl_number"`;
  SafetySuite TSafetyTestSuite `json:"safety_suite"`;
}

var NO_SAFETY_SUITE_ID = TSafetySuiteId("");


func SafetyTestHandler(w http.ResponseWriter, r *http.Request) {
  sessionId := GetSessionId(r);
  if (sessionId == NO_SESSION_ID) {
    w.WriteHeader(http.StatusUnauthorized);
    w.Write([]byte("Invalid session id\n"));
    return;
  }

  if (r.Method == http.MethodGet) {
    handleGetTestSuite(w, r, sessionId);
  } else if (r.Method == http.MethodPut) {
    if (strings.HasSuffix(r.URL.Path, "/email/")) {
      handleEmailTestResults(w, r, sessionId);
    } else {
      handleSaveTestResults(w, r, sessionId);
    }
  } else {
    w.WriteHeader(http.StatusMethodNotAllowed);
    w.Write([]byte("Unsupported method"));
  }
}


func handleGetTestSuite(w http.ResponseWriter, r *http.Request, sessionId TSessionId) {
  reservationId := *Sessions[sessionId].ReservationId;


  if (reservationId == NO_RESERVATION_ID) {
    w.WriteHeader(http.StatusBadRequest);
    w.Write([]byte("No reservaton in the context"));

    return;
  }
  
  reservation := GetActiveReservation(reservationId);
  if (reservation == nil) {
    w.WriteHeader(http.StatusNotFound);
    w.Write([]byte("Resevration does not exist"));

    return;
  }
  
  
  suiteId := "1";
  *Sessions[sessionId].SafetySuiteId = TSafetySuiteId(suiteId);
  
  testSuite := readTestSuite(suiteId);
  if (testSuite == nil) {
    w.WriteHeader(http.StatusInternalServerError);
    w.Write([]byte("Test Suite cannot be read"));

    return;
  }
  
  for _, test := range testSuite.Tests {
    test.AnswerOptionId = "";
  }

  processedTestSuite, _ := json.Marshal(testSuite);
  w.WriteHeader(http.StatusOK);
  w.Write(processedTestSuite);
}


func handleSaveTestResults(w http.ResponseWriter, r *http.Request, sessionId TSessionId) {
  reservationId := *Sessions[sessionId].ReservationId;
  if (reservationId == NO_RESERVATION_ID) {
    w.WriteHeader(http.StatusBadRequest);
    w.Write([]byte("No reservaton in the context"));

    return;
  }
  
  suiteId := *Sessions[sessionId].SafetySuiteId;
  if (suiteId == NO_SAFETY_SUITE_ID) {
    w.WriteHeader(http.StatusBadRequest);
    w.Write([]byte("No suite in the context"));

    return;
  }
  
  completedTestResult := parseSafetyTestResult(r.Body);
  if (completedTestResult == nil) {
    w.WriteHeader(http.StatusBadRequest);
    w.Write([]byte("Incorrect test results provided"));

    return;
  }
  
  testSuite := readTestSuite(string(suiteId));
  if (testSuite == nil) {
    w.WriteHeader(http.StatusInternalServerError);
    w.Write([]byte("Test Suite cannot be read"));

    return;
  }
  
  
  passedTests := 0;
  for testId, resultTest := range completedTestResult.SafetySuite.Tests {
    test := testSuite.Tests[testId];
    resultTest.Status = resultTest.AnswerOptionId == test.AnswerOptionId;
    if (resultTest.Status) {
      passedTests++;
    }
  }
  
  if (passedTests >= testSuite.PassingGrade) {
    reservation := GetActiveReservation(reservationId);
    if (reservation == nil) {
      w.WriteHeader(http.StatusNotFound);
      w.Write([]byte("Reservation does not exist"));

      return;
    }

    testResult := &TSafetyTestResult {
      PassDate: time.Now().UTC().UnixNano() / int64(time.Millisecond),
      ExpirationDate: time.Now().UTC().AddDate(0, 0, testSuite.ValidityPeriod).UnixNano() / int64(time.Millisecond),
      FirstName: completedTestResult.FirstName,
      LastName: completedTestResult.LastName,
      DLState: completedTestResult.DLState,
      DLNumber: completedTestResult.DLNumber,
      Score: int(100 * passedTests / len(testSuite.Tests)),
      SuiteId: suiteId,
    };
    
    dlId := testResult.DLState + "-" + testResult.DLNumber;
  
    SaveSafetyTestResult(testResult);
    
    if (testResult.DLState != reservation.DLState || testResult.DLNumber != reservation.DLNumber) {
      // We only register an additional driver if it is not the primary renter
      reservation.AdditionalDrivers = append(reservation.AdditionalDrivers, dlId);
      reservation.save();
    }
    
    EmailTestResults(reservationId, dlId, reservation.Email);
  }
  
  processedTestResult, _ := json.Marshal(completedTestResult);
  w.WriteHeader(http.StatusOK);
  w.Write(processedTestResult);
}


func readTestSuite(suiteId string) *TSafetyTestSuite {
  testSuite := TSafetyTestSuite{};
  
  testFileByteArray, err := ioutil.ReadFile(RuntimeRoot + "/safety/" + suiteId + ".json");
  if (err == nil) {
    err := json.Unmarshal(testFileByteArray, &testSuite);
    if (err != nil) {
      fmt.Println("Persistance: failed to read test suite", err);
    } else {
      fmt.Println("Persistance: account database is read");
    }
  } else {
    fmt.Println("Safety Test: failed to read suite file", err);
  }
  
  return &testSuite;
}


func handleEmailTestResults(w http.ResponseWriter, r *http.Request, sessionId TSessionId) {
  reservationId := *Sessions[sessionId].ReservationId;
  if (reservationId == NO_RESERVATION_ID) {
    w.WriteHeader(http.StatusNotFound);
    w.Write([]byte("No reservation selected"));

    return;
  }

  if (r.URL.RawQuery != "") {
    queryParams := parseQuery(r);

    reservation := GetActiveReservation(TReservationId(reservationId));
    if (reservation == nil) {
      w.WriteHeader(http.StatusNotFound);
      w.Write([]byte("Reservartion not found\n"))
    } else {
      email, hasEmail := queryParams["email"];
      if (!hasEmail) {
        email = reservation.Email;
      }
      
      dlState, hasDlState := queryParams["dl_state"];
      dlNumber, hasDlNumber := queryParams["dl_number"];

      var dlId string = "";
      if (hasDlState && hasDlNumber) {
        dlId = dlState + "-" + dlNumber;
      }
    
      if (EmailTestResults(reservationId, dlId, email)) {
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


func parseSafetyTestResult(body io.ReadCloser) *TCompletedSafetySuite {
  bodyBuffer, _ := ioutil.ReadAll(body);
  body.Close();
  
  completedTestSuite := &TCompletedSafetySuite{};
  err := json.Unmarshal(bodyBuffer, completedTestSuite);
  if (err != nil) {
    fmt.Println("Incorrect completed suite from received: ", err);
    return nil;
  }
  
  return completedTestSuite;
}

