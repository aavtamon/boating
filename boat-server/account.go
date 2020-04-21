package main

import "net/http"
import "encoding/json"
import "strings"
import "crypto/md5"
import "encoding/hex"
import "fmt"


type TBoatIds struct {
  Boats []string `json:"boats,omitempty"`;
}


type TOwnerAccountId string;
type TOwnerAccountType string;

type TOwnerAccount struct {
  Id TOwnerAccountId `json:"id,omitempty"`;
  Type TOwnerAccountType `json:"type,omitempty"`;

  Username string `json:"username,omitempty"`;
  Token string `json:"token,omitempty"`;
  
  FirstName string `json:"first_name,omitempty"`;
  LastName string `json:"last_name,omitempty"`;
  Email string `json:"email,omitempty"`;
  PrimaryPhone string `json:"primary_phone,omitempty"`;
  
  Locations map[string]TBoatIds `json:"locations,omitempty"`;
}

const OWNER_ACCOUNT_TYPE_BOATOWNER TOwnerAccountType = "boat_owner";
const OWNER_ACCOUNT_TYPE_ADMIN TOwnerAccountType = "admin";
const NO_OWNER_ACCOUNT_ID = TOwnerAccountId("");





func AccountHandler(w http.ResponseWriter, r *http.Request) {
  sessionId := GetSessionId(r);
  if (sessionId == NO_SESSION_ID) {
    w.WriteHeader(http.StatusUnauthorized);
    w.Write([]byte("Invalid session id\n"));
    return;
  }

  if (r.Method == http.MethodGet) {
    if (strings.HasSuffix(r.URL.Path, "/logout/")) {
      handleLogout(w, r, sessionId);
    } else {
      handleGetAccount(w, r, sessionId);
    }
  } else {
    w.WriteHeader(http.StatusMethodNotAllowed);
    w.Write([]byte("Unsupported method"));
  }
}


func handleGetAccount(w http.ResponseWriter, r *http.Request, sessionId TSessionId) {
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
  
fmt.Printf("Account token: <%s>\n", account.Token);  
    w.WriteHeader(http.StatusUnauthorized);
    w.Write([]byte("Wrong user name or password"));

    return;
  }

  *Sessions[sessionId].AccountId = TOwnerAccountId(username);

  ownerAccount, _ := json.Marshal(account);
  w.WriteHeader(http.StatusOK);
  w.Write(ownerAccount);
}

func handleLogout(w http.ResponseWriter, r *http.Request, sessionId TSessionId) {
  *Sessions[sessionId].AccountId = NO_OWNER_ACCOUNT_ID;
  delete(Sessions, sessionId);
  w.WriteHeader(http.StatusOK);
}


func calculateHash(password string, salt string) string {
  hasher := md5.New();
  hasher.Write([]byte(password));
  passwordHash := hex.EncodeToString(hasher.Sum([]byte(salt)));
  
  fmt.Printf("PASSWORD HASH: <%s>\n", passwordHash);
  
  return passwordHash;
}