BookingComplete = {
  reservationId: null,
  
  onLoad: function() {
    if (!this.reservationId) {
      Main.loadScreen("home");
    }
    
    ScreenUtils.form("#BookingComplete-Screen-ReservationSummary-Email", null, this._sendEmail);
  },
  
  _sendEmail: function() {
    var email = $("#BookingComplete-Screen-ReservationSummary-Email-Input").val();
    
    Main.showPopup("Sending confirmation...", '<center>Confirmation email is being sent</center>');
    Backend.sendConfirmationEmail(email, function(status) {
      Main.hidePopup();
      if (status == Backend.STATUS_SUCCESS) {
        Main.showMessage("Confirmation email sent", "The email was sent to <b>" + email + "</b>");
      } else if (status == Backend.STATUS_NOT_FOUND) {
        Main.showMessage("Not Successful", "For some reason the email was not sent. Please try again.");
      } else {
        Main.showMessage("Not Successful", "An error occured. Please try again");
      }
    });
  }
}