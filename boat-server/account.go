package main

import "net/http"
import "encoding/json"
import "fmt"


func AccountHandler(w http.ResponseWriter, r *http.Request) {
  fmt.Println("Payment Handler: request method=" + r.Method);
  
  if (r.Method == http.MethodGet) {
    queryParams := parseQuery(r);
    username, hasUsername := queryParams["username"];
    password, hasPassword := queryParams["password"];
    _, hasLogout := queryParams["logout"];
    
    sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
    
    if (hasLogout) {
      *Sessions[TSessionId(sessionCookie.Value)].AccountId = NO_OWNER_ACCOUNT_ID;
      
      w.WriteHeader(http.StatusOK);
    } else {
      if (!hasUsername || !hasPassword) {
        w.WriteHeader(http.StatusBadRequest);
        w.Write([]byte("Username or password is not provided"));

        return;
      }

      account := GetOwnerAccount(username);
      if (account == nil) {
        w.WriteHeader(http.StatusNotFound);
        w.Write([]byte("No such account"));

        return;
      }

      if (account.Token != calculateHash(password)) {
        w.WriteHeader(http.StatusUnauthorized);
        w.Write([]byte("Wrong user name or password"));

        return;
      }

      *Sessions[TSessionId(sessionCookie.Value)].AccountId = TOwnerAccountId(username);

      ownerAccount, _ := json.Marshal(account);
      w.WriteHeader(http.StatusOK);
      w.Write(ownerAccount);
    }
  } else {
    w.WriteHeader(http.StatusMethodNotAllowed);
    w.Write([]byte("Unsupported method"));
  }
}

func calculateHash(password string) string {
  return password;
}