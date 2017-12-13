package main

import "net/smtp"
import "fmt"
import "time"
import "bitbucket.org/ckvist/twilio/twirest"


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
  if (reservation == nil) {
    return;
  }
  
  email := reservation.Email;
  if (emailOverride != "") {
    email = emailOverride;
  }
  
  bookingReference := getBookingReference(reservation);
  
  emailText := "<center><h1 style='padding-top: 10px;'>Booking Confirmation - " + bookingReference + "</h1></center>";
  emailText += "<br><div style='font-size: 15px;'>Your reservation confirmation number is " + bookingReference + ".<br> You paid " + fmt.Sprintf("$%d", reservation.PaymentAmount) + " dollars.</div>";
  
  reservationDateTime := time.Unix(reservation.Slot.DateTime / 1000, 0).UTC();  
  emailText += "<br>Your ride is on <b>" + reservationDateTime.Format("Mon Jan 2 2006, 15:04") + "</b>.";
  
  boat := GetBookingConfiguration().Locations[reservation.LocationId].Boats[reservation.BoatId];
  emailText += "<br>Boat name: <b>" + boat.Name + "</b>";
  emailText += "<br>";
  
  location := GetBookingConfiguration().Locations[reservation.LocationId].PickupLocations[reservation.PickupLocationId];
  emailText += "<br>Pickup location: <b>" + location.Name + "</b> (" + location.Address + ")";
  emailText += "<br>Parking fee: <b>" + location.ParkingFee + "</b>";
  emailText += "<br>Special instructions: <b>" + location.Instructions + "</b>";
  emailText += "<br><br>";
  
  if (FindSafetyTestResult(reservation) != nil) {
    emailText += "Our records indicate that you have a valid safety test and do not need to take it again. You are good to go.";
  } else {
    emailText += "You do not seem to have a safety test passed. It is mandatory to pass it in order to be able to legally operate a motor boat in Georgia. Please take the test before your ride, otherwise you will have to take it on the boat before your ride begins. If you have multuple drivers, each of them have to have a valid test.";
    emailText += getSafetyTestLink(reservation);
  }
  
  emailText += "<br><br>In order to speed up your checkout process, you may also want to fill out waivers in advance and bring them with you. " + fmt.Sprintf("Please use this <a href='%s/files/docs/waivers.docx' download>link</a> to get the forms.", getWebsiteReference()); 

  emailText += fmt.Sprintf("<br><br>Please also take a chance to review <a href='%s/files/docs/rental-agreement.html'>Rental's agreement</a>.", getWebsiteReference());
  
  emailText += fmt.Sprintf("<br><br>Please contact us at <a href='mailto:reservations@bizboats.com?Subject=Inquery regarding reservation %s' target='_top'>reservations@bizboats.com</a> if you need any help.", reservationId);
  emailText += "<br>We look forward to seeing you soon!";
  
  sendEmail(email, fmt.Sprintf("Booking confirmation for %s", reservationId), emailText);
}


func EmailDayBeforeReminder(reservationId TReservationId) {
  fmt.Printf("Sending day-before email for reservation %s\n", reservationId);
  
  reservation := GetReservation(reservationId);
  if (reservation == nil) {
    return;
  }
  
  emailText := "<center><h1 style='padding-top: 10px;'>Your boat ride is coming!</h1></center>";
  reservationDateTime := time.Unix(reservation.Slot.DateTime / 1000, 0).UTC();  
  emailText += "<br>Your ride is on <b>" + reservationDateTime.Format("Mon Jan 2 2006, 15:04") + "</b>.";
  location := GetBookingConfiguration().Locations[reservation.LocationId].PickupLocations[reservation.PickupLocationId];
  emailText += "<br>Pickup location: <b>" + location.Name + "</b> (" + location.Address + ")";

  emailText += "<br>Your reservation confirmation number is " + getBookingReference(reservation) + " just in case you need to see or cancel it.";
  emailText += "<br><br>We hope to see you soon!";
  
  emailText += "<br><br>";
  
  if (FindSafetyTestResult(reservation) == nil) {
    emailText += "Our records indicate that you still did not take the safety test. It is mandatory to pass it in order to be able to legally operate a motor boat in Georgia. Please take the test before your ride, otherwise you will have to take it on the boat before your ride begins. If you have multuple drivers, each of them have to have a valid test.";
    emailText += getSafetyTestLink(reservation);
  }
  
  sendEmail(reservation.Email, fmt.Sprintf("PizBoats Ride Reminder", reservationId), emailText);
}

func EmailGetReadyReminder(reservationId TReservationId) {
  fmt.Printf("Sending get-ready email for reservation %s\n", reservationId);
  
  reservation := GetReservation(reservationId);
  if (reservation == nil) {
    return;
  }
  
  emailText := "<center><h1 style='padding-top: 10px;'>Your boat will begin in just a couple of hours!</h1></center>";
  reservationDateTime := time.Unix(reservation.Slot.DateTime / 1000, 0).UTC();  
  emailText += "<br>Your ride is on <b>" + reservationDateTime.Format("Mon Jan 2 2006, 15:04") + "</b>.";
  location := GetBookingConfiguration().Locations[reservation.LocationId].PickupLocations[reservation.PickupLocationId];
  emailText += "<br>Pickup location: <b>" + location.Name + "</b> (" + location.Address + ")";

  emailText += "<br>Your reservation confirmation number is " + getBookingReference(reservation) + " just in case you need to see or cancel it.";
  emailText += "<br><br>We hope to see you soon!";
  
  emailText += "<br><br>";
  
  if (FindSafetyTestResult(reservation) == nil) {
    emailText += "You have the last chance to take the safety test. Please take the test before your ride, otherwise you will have to take it on the boat before your ride begins. If you have multuple drivers, each of them have to have a valid test.";
    emailText += getSafetyTestLink(reservation);
  }
  
  sendEmail(reservation.Email, fmt.Sprintf("PizBoats Ride Reminder", reservationId), emailText);
}




func TextPaymentConfirmation(reservationId TReservationId) {
  reservation := GetReservation(reservationId);
  if (reservation == nil) {
    return;
  }

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

func TextDayBeforeReminder(reservationId TReservationId) {
  reservation := GetReservation(reservationId);
  if (reservation == nil) {
    return;
  }

  if (reservation.PrimaryPhone == "") {
    return;
  }

  fmt.Printf("Texting day-before reminder for reservation %s\n", reservationId);
  
  reservationDateTime := time.Unix(reservation.Slot.DateTime / 1000, 0).UTC();  
  
  sendTextMessage(reservation.PrimaryPhone, "Your boat ride is coming soon - " + reservationDateTime.Format("Mon Jan 2 2006, 15:04"));
}

func TextGetReadyReminder(reservationId TReservationId) {
  reservation := GetReservation(reservationId);
  if (reservation == nil) {
    return;
  }

  if (reservation.PrimaryPhone == "") {
    return;
  }

  fmt.Printf("Texting get-ready reminder for reservation %s\n", reservationId);
  
  reservationDateTime := time.Unix(reservation.Slot.DateTime / 1000, 0).UTC();  
  
  sendTextMessage(reservation.PrimaryPhone, "Your boat ride will begin soon. Please arrive to the pick up location before " + reservationDateTime.Format("15:04 on Jan 2 2006"));
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
  
  body += "<html><body style='width: 100%; background-color: rgb(255, 234, 191);'><div style='margin: 10px;'>";
  body += emailBody;
  body += "<div style='margin-top: 20px; font-style: italic; font-size: 15px; color: rgb(54, 84, 132);'>Best Regards,<br>PizBoats Team</div>";
  body += "</div>";
  body += "<div style='margin-top: 20px; padding: 10px; text-align: center; font-size: 15px; background-color: rgb(54, 84, 132); color: white;'>PizTec Corporation, 2017.&nbsp;&nbsp;&nbsp;All Rights Reserved.</div>";
  body += "</body></html>";
  


  err := smtp.SendMail(GetSystemConfiguration().EmailConfiguration.MailServer + ":" + GetSystemConfiguration().EmailConfiguration.ServerPort, auth, GetSystemConfiguration().EmailConfiguration.SourceAddress, []string{destinationAddress}, []byte(body));
  if (err != nil) {
      fmt.Printf("Failed to send an email %s", err);
  }
}


func sendTextMessage(phoneNumber string, messageText string) {
  if (!GetSystemConfiguration().SMSConfiguration.Enabled) {
    fmt.Println("SMS notifications are turned off - no text sent");
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




func getBookingReference(reservation *TReservation) string {
  return fmt.Sprintf("<a href='%s/main.html#reservation_retrieval?id=%s&name=%s&action=reservation_update'>%s</a>", getWebsiteReference(), reservation.Id, reservation.LastName, reservation.Id);
}

func getSafetyTestLink(reservation *TReservation) string {
  return fmt.Sprintf("<br>Use this <a href='%s/main.html#reservation_retrieval?id=%s&name=%s&action=safety_test'>Safety Test</a> link.", getWebsiteReference(), reservation.Id, reservation.LastName);
}

func getWebsiteReference() string {
  return fmt.Sprintf("https://%s:8443", GetSystemConfiguration().Domain);
}


/*
//import "net/http"
//import "net/url"
//import "strings"

const SMS_BRIDGE_URL = "https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json";


func sendTextMessage(phoneNumber string, messageText string) {
  if (!GetSystemConfiguration().SMSConfiguration.Enabled) {
    fmt.Println("SMS notifications are turned off - no text sent");
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