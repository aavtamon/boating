package main

import "os"
import "crypto/md5"
import "encoding/hex"
import "fmt"
import "log"

func main() {
  args := os.Args[1:]
  if (len(args) != 2) {
    log.Fatal("Please specify user's last name and password");
    return;
  }

  lastName := args[0];
  password := args[1];
  
  hasher := md5.New();
  hasher.Write([]byte(password));  
  clientHash := hex.EncodeToString(hasher.Sum([]byte(nil)));
  
  hasher = md5.New();
  hasher.Write([]byte(clientHash));  
  passwordHash := hex.EncodeToString(hasher.Sum([]byte(lastName)));
  
  fmt.Printf("Account password token: %s\n", passwordHash);  
}
