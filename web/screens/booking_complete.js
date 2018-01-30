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
    
    $("#BookingComplete-Screen-ReservationSummary-Email-SendButton").click(function() {
      Backend.sendConfirmationEmail(email, function(status) {
        if (status == Backend.STATUS_SUCCESS) {
          Main.showMessage("Confirmation email sent", "The email was sent to <b>" + email + "</b>");
        } else if (status == Backend.STATUS_NOT_FOUND) {
          Main.showMessage("Not Successful", "For some reason we don't see your reservation. Please try to pull it again.");
        } else {
          Main.showMessage("Not Successful", "An error occured. Please try again");
        }
      });
    });
  }
}