package main

import "log"
import "net/smtp"


const SOURCE_EMAIL_ADDRESS = "anton.avtamonov@mail.ru";
const SOURCE_EMAIL_PASSWORD = "xxxxxxx";


func EmailReservationConfirmation(reservationId TReservationId) {
  log.Println("Sending confirmation email for reservation %s", reservationId);
  
  sendEmail("anton.avtamonov@gmail.com", "Reservation " + string(reservationId) + " confirmed", "Your reservation is confirned");
}



func sendEmail(destinationAddress string, emailSubject string, emailBody string) {
  auth := smtp.PlainAuth("", SOURCE_EMAIL_ADDRESS, SOURCE_EMAIL_PASSWORD, "smtp.mail.ru");

  // and send the email all in one step.
  body := "From: " + SOURCE_EMAIL_ADDRESS + "\n";
  body += "To: " + destinationAddress + "\n";
  body += "Subject: " + emailSubject + "\n";
  body += emailBody;
  
  
  err := smtp.SendMail("smtp.mail.ru:587", auth, "anton.avtamonov@mail.ru", []string{destinationAddress}, []byte(body));
  if (err != nil) {
      log.Println("Failed to send an email", err);
  }
}

