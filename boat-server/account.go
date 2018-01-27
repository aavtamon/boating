package main

import "net/http"
import "encoding/json"
import "fmt"
import "strings"
import "crypto/md5"
import "encoding/hex"


func AccountHandler(w http.ResponseWriter, r *http.Request) {
  fmt.Println("Account Handler: request method=" + r.Method);
  
  if (r.Method == http.MethodGet) {
    if (strings.HasSuffix(r.URL.Path, "/logout")) {
      handleLogout(w, r);
    } else {
      handleGetAccount(w, r);
    }
  } else {
    w.WriteHeader(http.StatusMethodNotAllowed);
    w.Write([]byte("Unsupported method"));
  }
}


func handleGetAccount(w http.ResponseWriter, r *http.Request) {
  queryParams := parseQuery(r);
  username, hasUsername := queryParams["username"];
  password, hasPassword := queryParams["password"];


  if (!hasUsername || !hasPassword) {
    w.WriteHeader(http.StatusBadRequest);
    w.Write([]byte("Username or password is not provided"));

    return;
  }

  account := GetOwnerAccount(TOwnerAccountId(username));
  if (account == nil) {
    w.WriteHeader(http.StatusNotFound);
    w.Write([]byte("No such account"));

    return;
  }

  if (account.Token != calculateHash(password, account.LastName)) {
    w.WriteHeader(http.StatusUnauthorized);
    w.Write([]byte("Wrong user name or password"));

    return;
  }

  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE); 
  *Sessions[TSessionId(sessionCookie.Value)].AccountId = TOwnerAccountId(username);

  ownerAccount, _ := json.Marshal(account);
  w.WriteHeader(http.StatusOK);
  w.Write(ownerAccount);
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
  sessionCookie, _ := r.Cookie(SESSION_ID_COOKIE);
  *Sessions[TSessionId(sessionCookie.Value)].AccountId = NO_OWNER_ACCOUNT_ID;
  w.WriteHeader(http.StatusOK);
}


func calculateHash(password string, salt string) string {
  hasher := md5.New();
  hasher.Write([]byte(password));
  passwordHash := hex.EncodeToString(hasher.Sum([]byte(salt)));
  
  //fmt.Printf("PASSWORD HASH: <%s>\n", passwordHash);
  
  return passwordHash;
}