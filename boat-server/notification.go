package main

import "net/smtp"
import "fmt"
import "time"
import "bytes"
import "html/template"
import "bitbucket.org/ckvist/twilio/twirest"


const EMAIL_TEMPLATES_LOCATION = "emails";


type TReservationEmailObject struct {
  WebReference string;
  
  Reservation *TReservation;
  ReservationDateTime string;
  PickupLocation TPickupLocation;
  Boat TBoat;
  
  SafetyTestResult *TSafetyTestResult;
}


var twilioClient *twirest.TwilioClient = nil;


func NotifyReservationBooked(reservationId TReservationId) {
  reservation := GetReservation(reservationId);
  if (reservation == nil) {
    return;
  }
  
  isOwnerReservation := reservation.OwnerAccountId != NO_OWNER_ACCOUNT_ID;
  if (isOwnerReservation) {
    emailOwnerReservationBooked(reservation);
    textOwnerReservationBooked(reservation);
    
    emailAdminReservationBooked(reservation);
  } else {
    // We do not notify renters about booking. We only notify about payment
  }
}

func NotifyReservationCancelled(reservationId TReservationId) {
  reservation := GetReservation(reservationId);
  if (reservation == nil) {
    return;
  }
  
  isOwnerReservation := reservation.OwnerAccountId != NO_OWNER_ACCOUNT_ID;
  if (isOwnerReservation) {
    emailOwnerReservationCancelled(reservation);
    textOwnerReservationCancelled(reservation);
    
    emailAdminReservationCancelled(reservation);
  } else {
    // We do not notify renters about cancellation. We only notify about refund
  }
}

func NotifyReservationPaid(reservationId TReservationId) {
  reservation := GetReservation(reservationId);
  if (reservation == nil) {
    return;
  }
  
  emailRenterReservationPaid(reservation);
  textRenterReservationPaid(reservation);
  
  emailAdminReservationBooked(reservation);
}

func NotifyReservationRefunded(reservationId TReservationId) {
  reservation := GetReservation(reservationId);
  if (reservation == nil) {
    return;
  }
  
  emailRenterReservationRefunded(reservation);
  textRenterReservationRefunded(reservation);
  
  emailAdminReservationCancelled(reservation);
}

func NotifyDayBeforeReminder(reservationId TReservationId) {
  reservation := GetReservation(reservationId);
  if (reservation == nil) {
    return;
  }
  
  isOwnerReservation := reservation.OwnerAccountId != NO_OWNER_ACCOUNT_ID;
  if (isOwnerReservation) {
    emailOwnerDayBeforeReminder(reservation);
    textOwnerDayBeforeReminder(reservation);
  } else {
    emailRenterDayBeforeReminder(reservation);
    textRenterDayBeforeReminder(reservation);
  }
}

func NotifyGetReadyReminder(reservationId TReservationId) {
  reservation := GetReservation(reservationId);
  if (reservation == nil) {
    return;
  }
  
  isOwnerReservation := reservation.OwnerAccountId != NO_OWNER_ACCOUNT_ID;
  if (isOwnerReservation) {
    emailOwnerGetReadyReminder(reservation);
    textOwnerGetReadyReminder(reservation);
  } else {
    emailRenterGetReadyReminder(reservation);
    textRenterGetReadyReminder(reservation);
  }
}

func EmailReservationConfirmation(reservationId TReservationId, email string) bool {
  reservation := GetReservation(reservationId);
  if (reservation == nil) {
    return false;
  }
  
  fmt.Printf("Sending reservation confirmation email for reservation %s to %s\n", reservation.Id, email);
  
  templateName := "";
  isOwnerReservation := reservation.OwnerAccountId != NO_OWNER_ACCOUNT_ID;
  if (isOwnerReservation) {
    templateName = "owner_reservation_booked.html";
  } else {
    templateName = "renter_reservation_paid.html";
  }
  
  return sendReservationEmail(email, fmt.Sprintf("Booking confirmation for %s", reservation.Id), reservation, templateName);
}





func emailOwnerReservationBooked(reservation *TReservation) bool {
  fmt.Printf("Sending reservation-booked email for reservation %s\n", reservation.Id);
  
  account := GetOwnerAccount(reservation.OwnerAccountId);
  if (account == nil) {
    return false;
  }
  
  return sendReservationEmail(account.Email, fmt.Sprintf("Booking confirmation for %s", reservation.Id), reservation, "owner_reservation_booked.html");
}

func emailOwnerReservationCancelled(reservation *TReservation) bool {
  fmt.Printf("Sending reservation-cancelled email for reservation %s\n", reservation.Id);
  
  account := GetOwnerAccount(reservation.OwnerAccountId);
  if (account == nil) {
    return false;
  }
  
  return sendReservationEmail(account.Email, fmt.Sprintf("Booking %s cancelled", reservation.Id), reservation, "owner_reservation_cancelled.html");
}

func emailRenterReservationPaid(reservation *TReservation) bool {
  fmt.Printf("Sending reservation-paid email for reservation %s\n", reservation.Id);
  
  return sendReservationEmail(reservation.Email, fmt.Sprintf("Payment confirmation for %s", reservation.Id), reservation, "renter_reservation_paid.html");
}

func emailRenterReservationRefunded(reservation *TReservation) bool {
  fmt.Printf("Sending reservation-refunded email for reservation %s\n", reservation.Id);
  
  return sendReservationEmail(reservation.Email, fmt.Sprintf("Refund confirmation for %s", reservation.Id), reservation, "renter_reservation_refunded.html");
}

func emailOwnerDayBeforeReminder(reservation *TReservation) bool {
  fmt.Printf("Sending day-before email for reservation %s\n", reservation.Id);
  
  account := GetOwnerAccount(reservation.OwnerAccountId);
  if (account == nil) {
    return false;
  }
  
  return sendReservationEmail(account.Email, "PizBoats Ride Reminder", reservation, "owner_reservation_daybeforereminder.html");
}

func emailRenterDayBeforeReminder(reservation *TReservation) bool {
  fmt.Printf("Sending day-before email for reservation %s\n", reservation.Id);
  
  return sendReservationEmail(reservation.Email, "PizBoats Ride Reminder", reservation, "renter_reservation_daybeforereminder.html");
}

func emailOwnerGetReadyReminder(reservation *TReservation) bool {
  fmt.Printf("Sending get-ready email for reservation %s\n", reservation.Id);
  
  account := GetOwnerAccount(reservation.OwnerAccountId);
  if (account == nil) {
    return false;
  }
  
  return sendReservationEmail(account.Email, "PizBoats Ride Reminder", reservation, "owner_reservation_getreadyreminder.html");
}

func emailRenterGetReadyReminder(reservation *TReservation) bool {
  fmt.Printf("Sending get-ready email for reservation %s\n", reservation.Id);
  
  return sendReservationEmail(reservation.Email, "PizBoats Ride Reminder", reservation, "renter_reservation_getreadyreminder.html");
}

func emailAdminReservationBooked(reservation *TReservation) bool {
  fmt.Printf("Sending admin reservation-booked email for reservation %s\n", reservation.Id);
  
  adminAccounts := findMatchingAccounts(reservation.LocationId, reervation.BoatId);
  for account := range adminAccounts {
    if (account.Type == OWNER_ACCOUNT_TYPE_ADMIN) {
      sendReservationEmail(account.Email, "Reservation placed", reservation, "admin_boat_booked.html");
    } else {
      sendReservationEmail(account.Email, "Your boat was booked", reservation, "owner_boat_booked.html");
    }
  }
  
  return true;
}

func emailAdminReservationCancelled(reservation *TReservation) bool {
  fmt.Printf("Sending admin reservation-cancelled email for reservation %s\n", reservation.Id);
  
  adminAccounts := findMatchingAccounts(reservation.LocationId, reervation.BoatId);
  for account := range adminAccounts {
    if (account.Type == OWNER_ACCOUNT_TYPE_ADMIN) {
      sendReservationEmail(account.Email, "Reservation cancelled", reservation, "admin_boat_cancelled.html");
    } else {
      sendReservationEmail(account.Email, "Your boat was booked", reservation, "owner_boat_cancelled.html");
    }
  }
  
  return true;
}



func textOwnerReservationBooked(reservation *TReservation) bool {
  if (reservation.PrimaryPhone == "") {
    return false;
  }

  fmt.Printf("Texting booking confirmation for reservation %s\n", reservation.Id);
  
  return sendTextMessage(reservation.PrimaryPhone, fmt.Sprintf("Your boat ride is booked. Confirmation number is %s", reservation.Id));
}

func textOwnerReservationCancelled(reservation *TReservation) bool {
  if (reservation.PrimaryPhone == "") {
    return false;
  }

  fmt.Printf("Texting booking cancellation for reservation %s\n", reservation.Id);
  
  return sendTextMessage(reservation.PrimaryPhone, fmt.Sprintf("Your boat ride %s is cancelled.", reservation.Id));
}

func textRenterReservationPaid(reservation *TReservation) bool {
  if (reservation.PrimaryPhone == "") {
    return false;
  }

  fmt.Printf("Texting booking paid confirmation for reservation %s\n", reservation.Id);
  
  return sendTextMessage(reservation.PrimaryPhone, fmt.Sprintf("Your boat reservation is confirmed, your card is charged for the amount of $%d dollars. Confirmation number is %s", reservation.PaymentAmount, reservation.Id));
}

func textRenterReservationRefunded(reservation *TReservation) bool {
  if (reservation.PrimaryPhone == "") {
    return false;
  }

  fmt.Printf("Texting booking refunded for reservation %s\n", reservation.Id);
  
  return sendTextMessage(reservation.PrimaryPhone, fmt.Sprintf("Your boat reservation %s is cancelled, your refund in the amount of $%d dollars will be availbale within 5 business days.", reservation.Id, reservation.RefundAmount));
}

func textOwnerDayBeforeReminder(reservation *TReservation) bool {
  account := GetOwnerAccount(reservation.OwnerAccountId);
  if (account == nil) {
    return false;
  }

  fmt.Printf("Texting day-before reminder for reservation %s\n", reservation.Id);
  
  return sendTextMessage(account.PrimaryPhone, "Your boat ride is coming soon - " + time.Unix(reservation.Slot.DateTime / 1000, 0).UTC().Format("Mon Jan 2 2006, 15:04 PM"));
}

func textRenterDayBeforeReminder(reservation *TReservation) bool {
  fmt.Printf("Texting day-before reminder for reservation %s\n", reservation.Id);
  
  return sendTextMessage(reservation.PrimaryPhone, "Your boat ride is coming soon - " + time.Unix(reservation.Slot.DateTime / 1000, 0).UTC().Format("Mon Jan 2 2006, 15:04 PM"));
}

func textOwnerGetReadyReminder(reservation *TReservation) bool {
  account := GetOwnerAccount(reservation.OwnerAccountId);
  if (account == nil) {
    return false;
  }

  fmt.Printf("Texting get-ready reminder for reservation %s\n", reservation.Id);
  
  return sendTextMessage(account.PrimaryPhone, "Your boat ride is coming - " + time.Unix(reservation.Slot.DateTime / 1000, 0).UTC().Format("Mon Jan 2 2006, 15:04 PM") + ". Get ready for it.");
}

func textRenterGetReadyReminder(reservation *TReservation) bool {
  fmt.Printf("Texting day-before reminder for reservation %s\n", reservation.Id);
  
  return sendTextMessage(reservation.PrimaryPhone, "Your boat ride is coming soon - " + time.Unix(reservation.Slot.DateTime / 1000, 0).UTC().Format("Mon Jan 2 2006, 15:04 PM"));
}






func sendReservationEmail(destinationAddress string, emailSubject string, reservation *TReservation, emailTemplateName string) bool {
  emailTemplate, err := template.ParseFiles(RuntimeRoot + "/" + EMAIL_TEMPLATES_LOCATION + "/" + emailTemplateName, RuntimeRoot + "/" + EMAIL_TEMPLATES_LOCATION + "/email_envelope.html");
  
  if (err != nil) {
    fmt.Printf("Error parsing template: %s\n", err);
    return false;
  }

  emailObject := TReservationEmailObject {
    WebReference: fmt.Sprintf("https://%s:8443", GetSystemConfiguration().Domain),
    
    Reservation: reservation,
    ReservationDateTime: time.Unix(reservation.Slot.DateTime / 1000, 0).UTC().Format("Mon Jan 2 2006, 15:04 PM"),
    PickupLocation: GetBookingConfiguration().Locations[reservation.LocationId].PickupLocations[reservation.PickupLocationId],
    Boat: GetBookingConfiguration().Locations[reservation.LocationId].Boats[reservation.BoatId],
//    OwnerAccount: GetOwnerAccount(reservation.OwnerAccountId),
    SafetyTestResult: FindSafetyTestResult(reservation),
  }
  
  buf := new(bytes.Buffer);
  emailTemplate.Execute(buf, emailObject);
  
  return sendEmail(destinationAddress, emailSubject, buf.String());
}



func sendEmail(destinationAddress string, emailSubject string, emailBody string) bool {
  if (!GetSystemConfiguration().EmailConfiguration.Enabled) {
    fmt.Println("Email notifications are turned off - no email sent");
    return false;
  }

  auth := smtp.PlainAuth("", GetSystemConfiguration().EmailConfiguration.SourceAddress, GetSystemConfiguration().EmailConfiguration.ServerPassword, GetSystemConfiguration().EmailConfiguration.MailServer);

  // and send the email all in one step.
  body := "From: " + GetSystemConfiguration().EmailConfiguration.SourceAddress + "\n";
  body += "To: " + destinationAddress + "\n";
  body += "Subject: " + emailSubject + "\n";

  body += "Mime-Version: 1.0\n";
  body += "Content-Type: text/html; charset=\"ISO-8859-1\"\n\n";
  
  body += emailBody;
  
  body += "\n";
  
  err := smtp.SendMail(GetSystemConfiguration().EmailConfiguration.MailServer + ":" + GetSystemConfiguration().EmailConfiguration.ServerPort, auth, GetSystemConfiguration().EmailConfiguration.SourceAddress, []string{destinationAddress}, []byte(body));
  if (err != nil) {
    fmt.Printf("Failed to send an email %s\n", err);
    return false;
  }

  return true;
}


func sendTextMessage(phoneNumber string, messageText string) bool {
  if (!GetSystemConfiguration().SMSConfiguration.Enabled) {
    fmt.Println("SMS notifications are turned off - no text sent");
    return false;
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
    return false;
  } else {
    fmt.Printf("SMS sent successfully. Response: %v\n", resp.Message);
    return true;
  }
}





/*
//import "net/http"
//import "net/url"
//import "strings"

const SMS_BRIDGE_URL = "https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json";


func sendTextMessage(phoneNumber string, messageText string) bool {
  if (!GetSystemConfiguration().SMSConfiguration.Enabled) {
    fmt.Println("SMS notifications are turned off - no text sent");
    return false;
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
    return true;
  } else {
    fmt.Printf("SMS send failed with error %s\nFull message: %s", resp.Status, resp.Body);
    return false;
  }  
}
*/