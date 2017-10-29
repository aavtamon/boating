BookingComplete = {
  reservationId: null,
  
  onLoad: function() {
    if (!this.reservationId) {
      Main.loadScreen("home");
    }
    
    var emailData = {};
    
    $("#BookingComplete-Screen-ReservationSummary-Email-SendButton").prop("disabled", true);
    $("#BookingComplete-Screen-ReservationSummary-Email-SendButton").click(function() {
      Backend.resendConfirmationEmail(emailData.email, function(status) {
        if (status == Backend.STATUS_SUCCESS) {
          Main.showMessage("Confirmation email sent", "The email was sent to <b>" + emailData.email + "</b>");
        } else if (status == Backend.STATUS_NOT_FOUND) {
          Main.showMessage("Not Successful", "For some reason we don't see your reservation. Please try to pull it again.");
        } else {
          Main.showMessage("Not Successful", "An error occured. Please try again");
        }
      });
    }.bind(this));
    
    ScreenUtils.dataModelInput($("#BookingComplete-Screen-ReservationSummary-Email-Input")[0], emailData, "email", function(value) {
      $("#BookingComplete-Screen-ReservationSummary-Email-SendButton").prop("disabled", !ScreenUtils.isValidEmail(value));
    }, ScreenUtils.isValidEmail);
    
    
  },
}