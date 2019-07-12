OwnerReservationUpdate = {
  reservationId: null,
  reservationDateTime: null,
  reservationLocationId: null,
  reservationBoatId: null,
  ownerAccountEmail: null,
  
  onLoad: function() {
    if (!this.reservationId) {
      Main.loadScreen("owner_home");
      
      return;
    }
    
    $("#OwnerReservationUpdate-Screen-ReservationSummary-DateTime-Value").html(ScreenUtils.getBookingDate(this.reservationDateTime) + " " + ScreenUtils.getBookingTime(this.reservationDateTime));
    
    var boat = Backend.getBookingConfiguration().locations[this.reservationLocationId].boats[this.reservationBoatId];
    $("#OwnerReservationUpdate-Screen-ReservationSummary-Boat-Value").html(boat.name);
    
    $("#OwnerReservationUpdate-Screen-ReservationSummary-Email-Input").val(this.ownerAccountEmail);
    
    
    $("#OwnerReservationUpdate-Screen-ButtonsPanel-CancelButton").click(function() {
      this._cancelReservation();
    }.bind(this));

    
    ScreenUtils.form("#OwnerReservationUpdate-Screen-ReservationSummary-Email", null, this._sendEmail);    
  },

  _sendEmail: function() {
    var email = $("#OwnerReservationUpdate-Screen-ReservationSummary-Email-Input").val();
    
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
  },
  
  _cancelReservation: function() {
    var cancellationMessage = "Do you really want to cancel your reservation <b>" + OwnerReservationUpdate.reservationId + "</b>?";

    Main.showMessage("Confirm Cancelation", cancellationMessage, function(action) {
      if (action == Main.ACTION_OK) {
        Main.showPopup("Cancellation Processing", "Your cancellation request is being processed.<br>Do not refresh or close your browser");

        Backend.cancelReservation(function(status) {
          if (status == Backend.STATUS_SUCCESS) {
            Backend.resetReservationContext();
            
            Main.showMessage("Cancelled", "Your reservation was successfully cancelled", function() {
              Main.loadScreen("owner_home");
            });
          } else {
            console.error("reservation is not removed: " + OwnerReservationUpdate.reservationId);
            Main.showMessage("Cancellation failed", "Something went wrong - we could not cancel your reservation. Please try again. If the issue persist, please give us a call");
          }
        });
      }
    }, Main.DIALOG_TYPE_CONFIRMATION);
  }
}