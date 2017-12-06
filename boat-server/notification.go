package main

import "net/smtp"
import "fmt"
import "bitbucket.org/ckvist/twilio/twirest"

const WEBSITE_REFERENCE = "https://localhost:8443";

var twilioClient *twirest.TwilioClient = nil;


func EmailPaymentConfirmation(reservationId TReservationId) {
  fmt.Printf("Sending confirmation email for reservation %s\n", reservationId);
  
  EmailReservationConfirmation(reservationId, "");
}

func EmailRefundConfirmation(reservationId TReservationId) {
  fmt.Printf("Sending confirmation email for reservation %s\n", reservationId);
  
  reservation := GetReservation(reservationId);
  
  sendEmail(reservation.Email, fmt.Sprintf("Reservation %s is refunded", reservationId), fmt.Sprintf("Your boat reservation %s is cancelled. You will be refunded for the amount of $%d dollars within 5 business days", reservationId, reservation.RefundAmount));
}


func EmailReservationConfirmation(reservationId TReservationId, emailOverride string) {
  fmt.Printf("Sending confirmation email for reservation %s\n", reservationId);
  
  reservation := GetReservation(reservationId);
  
  safetyTestResult := FindSafetyTestResult(reservation);
  
  email := reservation.Email;
  if (emailOverride != "") {
    email = emailOverride;
  }
  
  bookingReference := fmt.Sprintf("<a href='%s/main.html#reservation_retrieval?id=%s&name=%s&action=reservation_update'>%s</a>", WEBSITE_REFERENCE, reservationId, reservation.LastName, reservationId);
  
  emailText := "<html><center><h1>Booking Confirmation - " + bookingReference + "</h1></center>";
  emailText += "<br>You booked a reservation " + bookingReference + " and payed " + fmt.Sprintf("$%d", reservation.PaymentAmount) + " dollars.";
  emailText += "<br><br>";
  
  if (safetyTestResult != nil) {
    emailText += "Our records indicate that you have a valid safety test and do not need to take it again. You are good to go.";
  } else {
    emailText += "You do not seem to have a safety test passed. It is mandatory to pass it in order to be able to legally operate a motor boat in Georgia. Please take the test before your ride, otherwise you will have to take it on the boat before your ride begins. If you have multuple drivers, each of them have to have a valid test.";
    emailText += fmt.Sprintf("<br>Use this <a href='%s/main.html#reservation_retrieval?id=%s&name=%s&action=safety_test'>Safety Test</a> link.", WEBSITE_REFERENCE, reservationId, reservation.LastName);
  }
  
  emailText += "<br><br>In order to speed up your checkout process, you may also want to fill out waivers in advance and bring them with you. " + fmt.Sprintf("Please use this <a href='%s/files/docs/waivers.docx' download>link</a> to get the forms.", WEBSITE_REFERENCE); 

  emailText += fmt.Sprintf("<br><br>Please also take a chance to review <a href='%s/files/docs/rental-agreement.html'>Rental's agreement</a> .", WEBSITE_REFERENCE);
  
  emailText += fmt.Sprintf("<br><br>Please contact us at <a href='mailto:reservations@bizboats.com?Subject=Inquery regarding reservation %s' target='_top'>reservations@bizboats.com</a> if you need any help", reservationId);
  
  emailText += "<br><br>Best regards,<br>BizBoats team";

  emailText += "</html>";
  
  sendEmail(email, fmt.Sprintf("Booking confirmation for %s", reservationId), emailText);
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
  
  body += "Mime-Version: 1.0\n";
  body += "Content-Type: text/html; charset=\"ISO-8859-1\"\n";
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

  if (twilioClient == nil) {
    twilioClient = twirest.NewClient(GetSystemConfiguration().SMSConfiguration.AccountSid, GetSystemConfiguration().SMSConfiguration.AuthToken);
  }
  
  
  msg := twirest.SendMessage {
    Text: messageText,
    From: GetSystemConfiguration().SMSConfiguration.SourcePhone,
    To: phoneNumber,
  }

  resp, err := twilioClient.Request(msg);
  if (err != nil) {
    fmt.Printf("SMS send failed with error %s\n", err);
  } else {
    fmt.Printf("SMS sent successfully. Response: %v\n", resp.Message);
  }
}




/*
//import "net/http"
//import "net/url"
//import "strings"

const SMS_BRIDGE_URL = "https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json";


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

  req, _ := http.NewRequest("POST", fmt.Sprintf(SMS_BRIDGE_URL, zGetSystemConfiguration().SMSConfiguration.AccountSid), rb);
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
*/