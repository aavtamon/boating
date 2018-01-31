package main


import "log"
import "fmt"
import "os"
import "strings"
import "io/ioutil"
import "html/template"
import "net/http"
import "math/rand"
import "time"


const WEB_ROOT = "web";
const CERTIFICATE_FILE = "certificate.cer";
const PRIVATE_KEY = "private_key.key";


type THtmlObject struct {
  CurrentTime int64;
  BookingConfiguration *TBookingConfiguration;
  AvailableDates TAvailableDates;
  Reservation *TReservation;
  ReservationSummaries []*TReservationSummary;
  OwnerAccount *TOwnerAccount;
  OwnerRentalStat *TRentalStat;
  SafetyTestStatus bool;
}

type TSession struct {
  ReservationId *TReservationId;
  AccountId *TOwnerAccountId;
  SafetySuiteId *TSafetySuiteId;
}

type TSessionId string;


const SESSION_ID_COOKIE = "sessionId";

var RuntimeRoot string = "";


var Sessions = make(map[TSessionId]TSession);


func parseQuery(r *http.Request) map[string]string {
  result := make(map[string]string);
  
  if (r.URL.RawQuery != "") {
    queryParts := strings.Split(r.URL.RawQuery, "&");
    for _, queryPart := range queryParts {
      queryNameValue := strings.Split(queryPart, "=");
      if (len(queryNameValue) != 2) {
        fmt.Println("Malformed query component: " + queryPart);
      }
      result[queryNameValue[0]] = queryNameValue[1];
    }
  }

  return result;
}


func redirectionHandler(w http.ResponseWriter, r *http.Request) {
  fmt.Printf("Serving index file\n");
  body, _ := ioutil.ReadFile(RuntimeRoot + "/" + WEB_ROOT + "/index.html");

  w.Header().Add("Content-Type", "text/html");
  w.Write(body);
}


func pageHandler(w http.ResponseWriter, r *http.Request) {
  pageReference := r.URL.Path[1:];
  if (pageReference == "") {
    pageReference = "index.html";
  }
  
  var sessionIdValue string = "";
  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
  if (sessionCookie == nil) {
    sessionIdValue = generateSessionId();

    fmt.Printf("New session detected. Assigned id = %s\n", sessionIdValue);


    sessionCookie = &http.Cookie{Name: SESSION_ID_COOKIE, Value: sessionIdValue};
    http.SetCookie(w, sessionCookie);
  } else {
    sessionIdValue = sessionCookie.Value;
  }
  
  sessionId := TSessionId(sessionIdValue);
  _, hasSession := Sessions[sessionId];
  if (!hasSession) {
    initialReservationId := NO_RESERVATION_ID;
    initialAccountId := NO_OWNER_ACCOUNT_ID;
    initialSuiteId := NO_SAFETY_SUITE_ID;
    Sessions[sessionId] = TSession{ReservationId: &initialReservationId, AccountId: &initialAccountId, SafetySuiteId: &initialSuiteId};
  }
  

  //fmt.Printf("***** Loading page %s *****\n", pageReference);

  pathToFile := RuntimeRoot + "/" + WEB_ROOT + "/" + pageReference;
  _, err := os.Stat(pathToFile);
  if (os.IsNotExist(err)) {
    pathToFile = pathToFile + ".html";
  }

  
  //fmt.Printf("Path to resource = %s\n", pathToFile);
  _, err = os.Stat(pathToFile);
  if (os.IsNotExist(err)) {
    w.WriteHeader(http.StatusNotFound);
    fmt.Printf("Requested resource %s does not exist\n", pathToFile);
  } else {
    if (strings.HasSuffix(pathToFile, ".html")) {
      fmt.Printf("Serving page %s\n", pathToFile);
      htmlTemplate, _ := template.ParseFiles(pathToFile);
      
      htmlObject := THtmlObject {
        CurrentTime: time.Now().UTC().UnixNano() / int64(time.Millisecond),
        BookingConfiguration: GetBookingConfiguration(),
        AvailableDates: GetAvailableDates(),
        
        ReservationSummaries: GetOwnerReservationSummaries(*Sessions[sessionId].AccountId),
        Reservation: GetReservation(*Sessions[sessionId].ReservationId),
        
        OwnerAccount: GetOwnerAccount(*Sessions[sessionId].AccountId),
        OwnerRentalStat: GetOwnerRentalStat(*Sessions[sessionId].AccountId),
        
        SafetyTestStatus: FindSafetyTestResult(GetReservation(*Sessions[sessionId].ReservationId)) != nil,
      }
      
      
      htmlTemplate.Execute(w, htmlObject);
    } else {
      //fmt.Printf("Serving file %s\n", pathToFile);
      body, _ := ioutil.ReadFile(pathToFile);
      
      mimeType := "text/plain";

      if strings.HasSuffix(pathToFile, ".css") {
        mimeType = "text/css"
      } else if strings.HasSuffix(pathToFile, ".js") {
        mimeType = "application/javascript"
      } else if strings.HasSuffix(pathToFile, ".png") {
        mimeType = "image/png"
      } else if strings.HasSuffix(pathToFile, ".svg") {
        mimeType = "image/svg+xml"
      }

      w.Header().Add("Content-Type", mimeType);
      
      w.Write(body);
    }
  }
  
  //fmt.Println("---------");
}



func generateSessionId() string {
  rand.Seed(time.Now().UnixNano());
  
  var bytes [30]byte;
  
  for i := 0; i < 30; i++ {
    bytes[i] = 65 + byte(rand.Intn(26));
  }
  
  return string(bytes[:]);
}



func main() {
  args := os.Args[1:]
  if (len(args) > 0) {
    RuntimeRoot = args[0];
  } else {
    log.Fatal("Runtime root directory is not provided");
    return;
  }


  InitializeSystemConfig();
  InitializePersistance();

  startHttpsServer();
}


func startHttpServer() {
  httpMux := http.NewServeMux();
  httpMux.HandleFunc("/reservation/payment/", PaymentHandler);
  httpMux.HandleFunc("/reservation/booking/", ReservationHandler);
  httpMux.HandleFunc("/bookings/", BookingsHandler);
  httpMux.HandleFunc("/account/", AccountHandler);
  httpMux.HandleFunc("/safety-test/", SafetyTestHandler);
  httpMux.Handle("/files/", http.FileServer(http.Dir(RuntimeRoot)));
  httpMux.HandleFunc("/", pageHandler);
  
  
  log.Fatal(http.ListenAndServe(":8080", httpMux));
}


func startHttpsServer() {
  httpMux := http.NewServeMux();
  httpMux.HandleFunc("/", redirectionHandler);
  
  
  httpsMux := http.NewServeMux();
  httpsMux.HandleFunc("/reservation/payment/", PaymentHandler);
  httpsMux.HandleFunc("/reservation/booking/", ReservationHandler);
  httpsMux.HandleFunc("/bookings/", BookingsHandler);
  httpsMux.HandleFunc("/account/", AccountHandler);
  httpsMux.HandleFunc("/safety-test/", SafetyTestHandler);
  httpsMux.Handle("/files/", http.FileServer(http.Dir(RuntimeRoot)));
  httpsMux.HandleFunc("/", pageHandler);
  
  
  go func() {
    log.Fatal(http.ListenAndServe(":8080", httpMux));
  }();

  log.Fatal(http.ListenAndServeTLS(":8443", RuntimeRoot + "/" + CERTIFICATE_FILE, RuntimeRoot + "/" + PRIVATE_KEY, httpsMux));
}
