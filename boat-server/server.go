package main


import "log"
import "os"
import "time"
import "strings"
import "io/ioutil"
import "html/template"
import "net/http"


type TPage struct {
  css string;
  html string;
  reservationContext TReservation;
}

type TReservation struct {

}



var PathToHtml string = "";
var ReservationContexts = map[string]TReservation{};

/*
func loadPage(title string) (*Page, error) {
  filename := title + ".txt"
  body, err := ioutil.ReadFile(filename)
  if err != nil {
      return nil, err
  }
  return &Page{Title: title, Body: body}, nil
}
*/


func defaultHandler(w http.ResponseWriter, r *http.Request) {
  pageReference := r.URL.Path[1:];
  if (pageReference == "") {
    pageReference = "main";
  }
  
  log.Println("***** Loading page " + pageReference + " *****");
  
  authCookie, _ := r.Cookie("auth");
  if (authCookie == nil) {
    log.Println("No auth context");
  }
  

  if (authCookie == nil) {
    authString := "jopca";

    expiration := time.Now().Add(365 * 24 * time.Hour);
    authCookie = &http.Cookie{Name: "auth", Value: authString, Expires: expiration};
    http.SetCookie(w, authCookie);

    ReservationContexts[authString] = TReservation{};
  }


  pathToFile := PathToHtml + "/" + pageReference;
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
      htmlTemplate.Execute(w, ReservationContexts[authCookie.Value]);
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


/*

func defaultHttpsHandler(w http.ResponseWriter, r *http.Request) {
  w.Header().Set("Content-Type", "text/plain")
  w.Write([]byte("This is an example server.\n"))
}

*/

func main() {
  args := os.Args[1:]
  if (len(args) > 0) {
    PathToHtml = args[0];
  } else {
    log.Fatal("Path to HTML templates is not provided");
    return;
  }


  httpMux := http.NewServeMux();
  httpMux.HandleFunc("/", defaultHandler);
  
  httpsMux := http.NewServeMux();
  //httpsMux.HandleFunc("/", handlers.DefaultHttpsHandler);
  
  
  go func() {
    log.Fatal(http.ListenAndServe(":8080", httpMux));
  }()

  log.Fatal(http.ListenAndServe(":8081", httpsMux));
  //log.Fatal(http.ListenAndServeTLS(":8443", "server.crt", "server.key", httpsMux))
}
