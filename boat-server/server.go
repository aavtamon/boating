package main


import "log"
import "fmt"
import "os"
import "strings"
import "io/ioutil"
import "html/template"
import "net/http"
import "net/url"
import "math/rand"
import "time"

const MAX_NUMBER_OF_KEPT_SESSIONS = 100;
const SESSION_MAX_LIFE = 30;

const WEB_ROOT = "web";
const CERTIFICATE_FILE = "certificate.cer";
const PRIVATE_KEY = "private_key.key";


type THtmlObject struct {
  CurrentTime int64;
  GeneralParams *TGeneralParams;
  BookingConfiguration *TBookingConfiguration;
  PaymentPublicKey string;
  AvailableDates TAvailableDates;
  Reservation *TReservation;
  ReservationSummaries []*TReservationSummary;
  OwnerAccount *TOwnerAccount;
  OwnerRentalStat *TRentalStat;
  UsageStats *TUsageStats;
  SafetyTestResults TSafetyTestResults;
  
  FormatDateTime func(int64) string;
}

type TSession struct {
  ReservationId *TReservationId;
  AccountId *TOwnerAccountId;
  SafetySuiteId *TSafetySuiteId;
  LastAccessed *time.Time;
}

type TSessionId string;

const NO_SESSION_ID = TSessionId("");

const SESSION_ID_COOKIE = "sessionId";

var RuntimeRoot string = "";


var Sessions = make(map[TSessionId]TSession);


func GetSessionId(r *http.Request) TSessionId {
  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
  if (sessionCookie != nil) {
    sessionId := TSessionId(sessionCookie.Value);
    _, hasSession := Sessions[sessionId];
    if (hasSession) {
      return sessionId;
    }
  }

  return NO_SESSION_ID;
}

func parseQuery(r *http.Request) map[string]string {
  result := make(map[string]string);
  
  if (r.URL.RawQuery != "") {
    queryParts := strings.Split(r.URL.RawQuery, "&");
    for _, queryPart := range queryParts {
      queryNameValue := strings.Split(queryPart, "=");
      if (len(queryNameValue) != 2) {
        fmt.Println("Malformed query component: " + queryPart);
      }
      result[queryNameValue[0]], _ = url.QueryUnescape(queryNameValue[1]);
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


  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
  if (sessionCookie != nil) {
    sessionId := TSessionId(sessionCookie.Value);
    session, hasSession := Sessions[sessionId];
    if (hasSession) {
      sessionTimePlusInactivity := session.LastAccessed.Add(SESSION_MAX_LIFE * time.Minute);
      if (sessionTimePlusInactivity.Before(time.Now().UTC())) {
        delete(Sessions, sessionId);
        
        sessionCookie = nil; //we will need to regenerate the cookie
      }
    } else {
      sessionCookie = nil; //we will need to regenerate the cookie
    }
  }
  
  if (sessionCookie == nil) {
    sessionCookie = &http.Cookie{Name: SESSION_ID_COOKIE, Value: generateSessionId(), Path: "/"};
    http.SetCookie(w, sessionCookie);
  }
  
  sessionId := TSessionId(sessionCookie.Value);
  _, hasSession := Sessions[sessionId];
  if (!hasSession) {
    fmt.Printf("New session detected. Assigned id = %s\n", sessionId);

    initialReservationId := NO_RESERVATION_ID;
    initialAccountId := NO_OWNER_ACCOUNT_ID;
    initialSuiteId := NO_SAFETY_SUITE_ID;
    lastAccessed := time.Now().UTC();
    
    Sessions[sessionId] = TSession{ReservationId: &initialReservationId, AccountId: &initialAccountId, SafetySuiteId: &initialSuiteId, LastAccessed: &lastAccessed};
  } else {
    *Sessions[sessionId].LastAccessed = time.Now().UTC();
  }
  
  removeOldSessions();
  
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
      //fmt.Printf("Serving page %s\n", pathToFile);
      htmlTemplate, err := template.ParseFiles(pathToFile);
      if (err != nil) {
        fmt.Printf("Error parsing template: %s\n", err);
      }
      
      htmlObject := THtmlObject {
        CurrentTime: time.Now().UTC().UnixNano() / int64(time.Millisecond),
        GeneralParams: GetGeneralParams(),
        BookingConfiguration: GetBookingConfiguration(),
        AvailableDates: GetAvailableDates(),
        PaymentPublicKey: GetSystemConfiguration().PaymentConfiguration.PublicKey,
        
        ReservationSummaries: GetOwnerReservationSummaries(*Sessions[sessionId].AccountId),
        Reservation: GetActiveReservation(*Sessions[sessionId].ReservationId),
        
        OwnerAccount: GetOwnerAccount(*Sessions[sessionId].AccountId),
        OwnerRentalStat: GetOwnerRentalStat(*Sessions[sessionId].AccountId),
        
        UsageStats: GetUsageStats(*Sessions[sessionId].AccountId),
        
        SafetyTestResults: FindSafetyTestResults(GetActiveReservation(*Sessions[sessionId].ReservationId)),
        
        FormatDateTime: func(dateTime int64) string {
          return getFormattedDateTime(dateTime);
        },
      }
      
      
      err = htmlTemplate.Execute(w, htmlObject);
      if (err != nil) {
        fmt.Printf("Error executing template: %s\n", err);
      }
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


func removeOldSessions() {
  if (len(Sessions) <= MAX_NUMBER_OF_KEPT_SESSIONS) {
    return;
  }

  now := time.Now().UTC();
  for sessionId, session := range Sessions {
      sessionTimePlusInactivity := session.LastAccessed.Add(SESSION_MAX_LIFE * time.Minute);
      if (sessionTimePlusInactivity.Before(now)) {
        delete(Sessions, sessionId);
        
        fmt.Printf("Session %s was removed as obsolete\n", sessionId);
      }
  }
  
  if (len(Sessions) > MAX_NUMBER_OF_KEPT_SESSIONS) {
    fmt.Printf("WARNING: no sessions were removed by the session reduction cycle. Number of active sessions %d\n", len(Sessions));
  }  
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
  
  
  log.Fatal(http.ListenAndServe(":" + GetSystemConfiguration().ServerConfiguration.HttpPort, httpMux));
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
  httpsMux.Handle("/files/", http.FileServer(http.Dir(RuntimeRoot + "/" + WEB_ROOT)));
  httpsMux.HandleFunc("/", pageHandler);
  
  
  go func() {
    log.Fatal(http.ListenAndServe(":" + GetSystemConfiguration().ServerConfiguration.HttpPort, httpMux));
  }();

  log.Fatal(http.ListenAndServeTLS(":" + GetSystemConfiguration().ServerConfiguration.HttpsPort, RuntimeRoot + "/" + GetSystemConfiguration().ServerConfiguration.Certificate, RuntimeRoot + "/" + GetSystemConfiguration().ServerConfiguration.PrivateKey, httpsMux));
}



// Utils

func getFormattedDateTime(dateTime int64) string {
  return time.Unix(dateTime / 1000, 0).UTC().Format("Mon Jan 2 2006, 15:04 PM");
}

func isAdmin(sessionId TSessionId) bool {
  if (*Sessions[sessionId].AccountId == NO_OWNER_ACCOUNT_ID) {
    return false;
  }

  account := GetOwnerAccount(*Sessions[sessionId].AccountId);
  return account != nil && account.Type == OWNER_ACCOUNT_TYPE_ADMIN;
}
