package main

import "net/smtp"
import "net/http"
import "net/url"
import "strings";
import "fmt"


const EMAIL_NOTIFICATIONS_ENABLED = false;
const SOURCE_EMAIL_ADDRESS = "anton.avtamonov@mail.ru";
const SOURCE_EMAIL_PASSWORD = "xxxxxxx";

const SMS_NOTIFICATIONS_ENABLED = true;
const SMS_BRIDGE_ACCOUNT_SID = "ACaae4695f3e7b6bfb8ff0d29bddb2d9d6";
const SMS_BRIDGE_AUTH_TOKEN = "18a073e377b885621736318a0e0ca335";
const SMS_BRIDGE_URL = "https://api.twilio.com/2010-04-01/Accounts/" + SMS_BRIDGE_ACCOUNT_SID + "/Messages.json";
const SMS_BRIDGE_PHONE_NUMBER = "+17707668219";


func EmailPaymentConfirmation(reservationId TReservationId) {
  fmt.Printf("Sending confirmation email for reservation %s\n", reservationId);
  
  reservation := GetReservation(reservationId);
  
  sendEmail("anton.avtamonov@gmail.com", fmt.Sprintf("Reservation %s is confirmed", reservationId), fmt.Sprintf("Your boat reservation %s is placed. You are charged for $%d dollars", reservationId, reservation.PaymentAmount));
}

func EmailRefundConfirmation(reservationId TReservationId) {
  fmt.Printf("Sending confirmation email for reservation %s\n", reservationId);
  
  reservation := GetReservation(reservationId);
  
  sendEmail("anton.avtamonov@gmail.com", fmt.Sprintf("Reservation %s is refunded", reservationId), fmt.Sprintf("Your boat reservation %s is cancelled. You will be refunded for the amount of $%d dollars within 5 business days", reservationId, reservation.RefundAmount));
}



func TextPaymentConfirmation(reservationId TReservationId) {
  reservation := GetReservation(reservationId);

  if (reservation.NoMobilePhone) {
    return;
  }

  fmt.Printf("Texting payment confirmation for reservation %s\n", reservationId);
  
  sendTextMessage(reservation.MobilePhone, fmt.Sprintf("Your boat reservation is confirmed, your card is charged for the amount of $%d  dollars. Confirmation number is %s", reservation.PaymentAmount, reservationId));
}

func TextRefundConfirmation(reservationId TReservationId) {
  reservation := GetReservation(reservationId);

  if (reservation.NoMobilePhone) {
    return;
  }

  fmt.Printf("Texting refund confirmation for reservation %s\n", reservationId);
  
  sendTextMessage(reservation.MobilePhone, fmt.Sprintf("Your boat reservation %s is cancelled, your refund in the amount of $%d dollars will be availbale within 5 business days.", reservationId, reservation.RefundAmount));
}






func sendEmail(destinationAddress string, emailSubject string, emailBody string) {
  if (!EMAIL_NOTIFICATIONS_ENABLED) {
    fmt.Println("Email notifications are turned off - no email sent");
    return;
  }

  auth := smtp.PlainAuth("", SOURCE_EMAIL_ADDRESS, SOURCE_EMAIL_PASSWORD, "smtp.mail.ru");

  // and send the email all in one step.
  body := "From: " + SOURCE_EMAIL_ADDRESS + "\n";
  body += "To: " + destinationAddress + "\n";
  body += "Subject: " + emailSubject + "\n";
  body += emailBody;
  
  
  err := smtp.SendMail("smtp.mail.ru:587", auth, "anton.avtamonov@mail.ru", []string{destinationAddress}, []byte(body));
  if (err != nil) {
      fmt.Printf("Failed to send an email %s", err);
  }
}



func sendTextMessage(phoneNumber string, messageText string) {
  if (!SMS_NOTIFICATIONS_ENABLED) {
    fmt.Println("SMS notifications are turned off - no email sent");
    return;
  }

  v := url.Values{}
  v.Set("To", phoneNumber);
  v.Set("From", SMS_BRIDGE_PHONE_NUMBER);
  v.Set("Body", messageText);
  rb := strings.NewReader(v.Encode());

  client := &http.Client{};

  req, _ := http.NewRequest("POST", SMS_BRIDGE_URL, rb);
  req.SetBasicAuth(SMS_BRIDGE_ACCOUNT_SID, SMS_BRIDGE_AUTH_TOKEN);
  req.Header.Add("Accept", "application/json");
  req.Header.Add("Content-Type", "application/x-www-form-urlencoded");

  resp, _ := client.Do(req);
  
  if (resp.StatusCode >= 200 && resp.StatusCode < 300) {
    fmt.Printf("SMS success. Portal reponse %s\n", resp.Body);
  } else {
    fmt.Printf("SMS send failed with error %s\nFull message: %s", resp.Status, resp.Body);
  }  
}

