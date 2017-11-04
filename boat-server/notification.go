package main

import "net/smtp"
import "net/http"
import "net/url"
import "strings";
import "fmt"


const SMS_BRIDGE_URL = "https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json";


func EmailPaymentConfirmation(reservationId TReservationId) {
  fmt.Printf("Sending confirmation email for reservation %s\n", reservationId);
  
  reservation := GetReservation(reservationId);
  
  sendEmail(reservation.Email, fmt.Sprintf("Reservation %s is confirmed", reservationId), fmt.Sprintf("Your boat reservation %s is placed. You are charged for $%d dollars", reservationId, reservation.PaymentAmount));
}

func EmailRefundConfirmation(reservationId TReservationId) {
  fmt.Printf("Sending confirmation email for reservation %s\n", reservationId);
  
  reservation := GetReservation(reservationId);
  
  sendEmail(reservation.Email, fmt.Sprintf("Reservation %s is refunded", reservationId), fmt.Sprintf("Your boat reservation %s is cancelled. You will be refunded for the amount of $%d dollars within 5 business days", reservationId, reservation.RefundAmount));
}


func EmailReservationConfirmation(reservationId TReservationId, emailOverride string) {
  fmt.Printf("Sending confirmation email for reservation %s\n", reservationId);
  
  reservation := GetReservation(reservationId);
  
  email := reservation.Email;
  if (emailOverride != "") {
    email = emailOverride;
  }
  
  sendEmail(email, fmt.Sprintf("Reservation %s is booked", reservationId), fmt.Sprintf("Details of your boat reservation %s", reservationId));
}


func TextPaymentConfirmation(reservationId TReservationId) {
  reservation := GetReservation(reservationId);

  if (reservation.PrimaryPhone == "") {
    return;
  }

  fmt.Printf("Texting payment confirmation for reservation %s\n", reservationId);
  
  sendTextMessage(reservation.PrimaryPhone, fmt.Sprintf("Your boat reservation is confirmed, your card is charged for the amount of $%d  dollars. Confirmation number is %s", reservation.PaymentAmount, reservationId));
}

func TextRefundConfirmation(reservationId TReservationId) {
  reservation := GetReservation(reservationId);

  if (reservation.PrimaryPhone == "") {
    return;
  }

  fmt.Printf("Texting refund confirmation for reservation %s\n", reservationId);
  
  sendTextMessage(reservation.PrimaryPhone, fmt.Sprintf("Your boat reservation %s is cancelled, your refund in the amount of $%d dollars will be availbale within 5 business days.", reservationId, reservation.RefundAmount));
}






func sendEmail(destinationAddress string, emailSubject string, emailBody string) {
  if (!GetSystemConfiguration().EmailConfiguration.Enabled) {
    fmt.Println("Email notifications are turned off - no email sent");
    return;
  }

  auth := smtp.PlainAuth("", GetSystemConfiguration().EmailConfiguration.SourceAddress, GetSystemConfiguration().EmailConfiguration.ServerPassword, GetSystemConfiguration().EmailConfiguration.MailServer);

  // and send the email all in one step.
  body := "From: " + GetSystemConfiguration().EmailConfiguration.SourceAddress + "\n";
  body += "To: " + destinationAddress + "\n";
  body += "Subject: " + emailSubject + "\n";
  body += emailBody;
  
  
  err := smtp.SendMail(GetSystemConfiguration().EmailConfiguration.MailServer + ":" + GetSystemConfiguration().EmailConfiguration.ServerPort, auth, GetSystemConfiguration().EmailConfiguration.SourceAddress, []string{destinationAddress}, []byte(body));
  if (err != nil) {
      fmt.Printf("Failed to send an email %s", err);
  }
}



func sendTextMessage(phoneNumber string, messageText string) {
  if (!GetSystemConfiguration().SMSConfiguration.Enabled) {
    fmt.Println("SMS notifications are turned off - no email sent");
    return;
  }

  v := url.Values{}
  v.Set("To", phoneNumber);
  v.Set("From", GetSystemConfiguration().SMSConfiguration.SourcePhone);
  v.Set("Body", messageText);
  rb := strings.NewReader(v.Encode());

  client := &http.Client{};

  req, _ := http.NewRequest("POST", fmt.Sprintf(SMS_BRIDGE_URL, GetSystemConfiguration().SMSConfiguration.AccountSid), rb);
  req.SetBasicAuth(GetSystemConfiguration().SMSConfiguration.AccountSid, GetSystemConfiguration().SMSConfiguration.AuthToken);
  req.Header.Add("Accept", "application/json");
  req.Header.Add("Content-Type", "application/x-www-form-urlencoded");

  resp, _ := client.Do(req);
  
  if (resp.StatusCode >= 200 && resp.StatusCode < 300) {
    fmt.Printf("SMS success. Portal reponse %s\n", resp.Status);
  } else {
    fmt.Printf("SMS send failed with error %s\nFull message: %s", resp.Status, resp.Body);
  }  
}

