package main


import "log"
import "os"
import "strings"
import "io/ioutil"
import "html/template"
import "net/http"
import "math/rand"
import "time"


type THtmlObject struct {
  BookingSettings *TBookingSettings;
  BookingConfiguration *TBookingConfiguration;
  AvailableDates TAvailableDates;
  Reservation *TReservation;
}

type TSessionId string;


const SESSION_ID_COOKIE = "sessionId";

var RuntimeRoot string = "";


var Sessions = make(map[TSessionId]TReservationId);


func parseQuery(r *http.Request) map[string]string {
  result := make(map[string]string);
  
  if (r.URL.RawQuery != "") {
    queryParts := strings.Split(r.URL.RawQuery, "&");
    for _, queryPart := range queryParts {
      queryNameValue := strings.Split(queryPart, "=");
      if (len(queryNameValue) != 2) {
        log.Println("Malformed query component: " + queryPart);
      }
      result[queryNameValue[0]] = queryNameValue[1];
    }
  }

  return result;
}


func pageHandler(w http.ResponseWriter, r *http.Request) {
  pageReference := r.URL.Path[1:];
  if (pageReference == "") {
    pageReference = "main";
  }
  
  var sessionId string = "";
  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
  if (sessionCookie == nil) {
    sessionId = generateSessionId();

    log.Println("New session detected. Assigned id = " + sessionId);


    sessionCookie = &http.Cookie{Name: SESSION_ID_COOKIE, Value: sessionId};
    http.SetCookie(w, sessionCookie);

    Sessions[TSessionId(sessionId)] = NO_RESERVATION_ID;
  } else {
    sessionId = sessionCookie.Value;
  }

  log.Println("***** Loading page " + pageReference + " *****");
  
  

  pathToFile := RuntimeRoot + "/web/" + pageReference;
  _, err := os.Stat(pathToFile);
  if (os.IsNotExist(err)) {
    pathToFile = pathToFile + ".html";
  }

  
  log.Println("Path to resource = " + pathToFile);
  _, err = os.Stat(pathToFile);
  if (os.IsNotExist(err)) {
    w.WriteHeader(http.StatusNotFound);
    log.Println("Requested resource " + pathToFile + " does not exist");
  } else {
    if (strings.HasSuffix(pathToFile, ".html")) {
      log.Println("Serving page " + pathToFile);
      htmlTemplate, _ := template.ParseFiles(pathToFile);
      
      htmlObject := THtmlObject {
        BookingSettings: GetBookingSettings(),
        BookingConfiguration: GetBookingConfiguration(),
        AvailableDates: GetAvailableDates(),
        Reservation: GetReservation(Sessions[TSessionId(sessionId)]),
      }
      
      
      
      htmlTemplate.Execute(w, htmlObject);
    } else {
      log.Println("Serving file " + pathToFile);
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
  
  log.Println("---------");
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
    log.Fatal("Path to HTML templates is not provided");
    return;
  }

  InitializePersistance(RuntimeRoot);
  InitializeBookings();

  httpMux := http.NewServeMux();
  httpMux.HandleFunc("/reservation/payment/", PaymentHandler);
  httpMux.HandleFunc("/reservation/booking/", ReservationHandler);
  httpMux.HandleFunc("/bookings/", BookingsHandler);
  httpMux.Handle("/files/", http.FileServer(http.Dir(RuntimeRoot)));
  httpMux.HandleFunc("/", pageHandler);
  
  
  //httpsMux := http.NewServeMux();
  //httpsMux.HandleFunc("/", ReservationHandler);
  
  
  //go func() {
    log.Fatal(http.ListenAndServe(":8080", httpMux));
  //}();

  //log.Fatal(http.ListenAndServe(":8081", httpsMux));
  //log.Fatal(http.ListenAndServeTLS(":8443", "server.crt", "server.key", httpsMux))
}
