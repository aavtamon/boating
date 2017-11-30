package main

import "net/http"
import "encoding/json"
import "fmt"
import "io"
import "io/ioutil"


type TSafetyTest struct {
  Text string `json:"text"`;
  Options map[string]string `json:"options"`;
  AnswerOptionId string `json:"answer_option_id"`;
  Status bool `json:"status"`;
}

type TSafetySuiteId string;

type TSafetyTestSuite struct {
  Tests map[string]*TSafetyTest `json:"tests"`;
}

var NO_SAFETY_SUITE_ID = TSafetySuiteId("");

var testFilesDir string;


func InitializeSafetyTest(testRoot string) {
  testFilesDir = testRoot;
}

func SafetyTestHandler(w http.ResponseWriter, r *http.Request) {
  fmt.Println("Safety Test Handler: request method=" + r.Method);
  
  if (r.Method == http.MethodGet) {
    handleGetTestSuite(w, r);
  } else if (r.Method == http.MethodPut) {
    handleSaveTestSuiteResults(w, r);
  } else {
    w.WriteHeader(http.StatusMethodNotAllowed);
    w.Write([]byte("Unsupported method"));
  }
}


func handleGetTestSuite(w http.ResponseWriter, r *http.Request) {
  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE); 
  reservationId := *Sessions[TSessionId(sessionCookie.Value)].ReservationId;


  if (reservationId == NO_RESERVATION_ID) {
    w.WriteHeader(http.StatusBadRequest);
    w.Write([]byte("No reservaton in the context"));

    return;
  }
  
  reservation := GetReservation(reservationId);
  if (reservation == nil) {
    w.WriteHeader(http.StatusNotFound);
    w.Write([]byte("Resevration does not exist"));

    return;
  }
  
  
  suiteId := "1";
  *Sessions[TSessionId(sessionCookie.Value)].SafetySuiteId = TSafetySuiteId(suiteId);
  
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


func handleSaveTestSuiteResults(w http.ResponseWriter, r *http.Request) {
  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
  
  reservationId := *Sessions[TSessionId(sessionCookie.Value)].ReservationId;
  if (reservationId == NO_RESERVATION_ID) {
    w.WriteHeader(http.StatusBadRequest);
    w.Write([]byte("No reservaton in the context"));

    return;
  }
  
  reservation := GetReservation(reservationId);
  if (reservation == nil) {
    w.WriteHeader(http.StatusNotFound);
    w.Write([]byte("Resevration does not exist"));

    return;
  }
  
  suiteId := *Sessions[TSessionId(sessionCookie.Value)].SafetySuiteId;
  if (suiteId == NO_SAFETY_SUITE_ID) {
    w.WriteHeader(http.StatusBadRequest);
    w.Write([]byte("No suite in the context"));

    return;
  }
  
  resultTestSuite := parseSafetySuite(r.Body);
  if (resultTestSuite == nil) {
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
  
  

  for testId, resultTest := range resultTestSuite.Tests {
    test := testSuite.Tests[testId];
    resultTest.Status = resultTest.AnswerOptionId == test.AnswerOptionId;
  }
  
  processedTestSuite, _ := json.Marshal(resultTestSuite);
  w.WriteHeader(http.StatusOK);
  w.Write(processedTestSuite);
}


func readTestSuite(suiteId string) *TSafetyTestSuite {
  testSuite := TSafetyTestSuite{};
  
  testFileByteArray, err := ioutil.ReadFile(testFilesDir + "/safety/" + suiteId + ".json");
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



func parseSafetySuite(body io.ReadCloser) *TSafetyTestSuite {
  bodyBuffer, _ := ioutil.ReadAll(body);
  body.Close();
  
  suite := &TSafetyTestSuite{};
  err := json.Unmarshal(bodyBuffer, suite);
  if (err != nil) {
    fmt.Println("Incorrect suite from the app: ", err);
    return nil;
  }
  
  return suite;
}

