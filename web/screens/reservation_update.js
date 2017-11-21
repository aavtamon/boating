ReservationUpdate = {
  reservationId: null,
  reservationDateTime: null,
  reservationLocationId: null,
  reservationBoatId: null,
  reservationPickupLocationId: null,
  reservationCost: null,
  reservationEmail: null,
  reservationExtras: null,
  currentDate: null,
  extras: null,
  
  onLoad: function() {
    if (!this.reservationId) {
      Main.loadScreen("home");
      
      return;
    }
    
    $("#ReservationUpdate-Screen-ReservationSummary-DateTime-Value").html(ScreenUtils.getBookingDate(this.reservationDateTime) + " " + ScreenUtils.getBookingTime(this.reservationDateTime));
    
    var boat = Backend.getBookingConfiguration().locations[this.reservationLocationId].boats[this.reservationBoatId];
    $("#ReservationUpdate-Screen-ReservationSummary-Boat-Value").html(boat.name);
    
    var location = Backend.getBookingConfiguration().locations[this.reservationLocationId].pickup_locations[this.reservationPickupLocationId];
    $("#ReservationUpdate-Screen-ReservationSummary-Location-Details-PlaceName-Value").html(location.name);
    $("#ReservationUpdate-Screen-ReservationSummary-Location-Details-PlaceAddress-Value").html(location.address);
    $("#ReservationUpdate-Screen-ReservationSummary-Location-Details-ParkingFee-Value").html(location.parking_fee);
    $("#ReservationUpdate-Screen-ReservationSummary-Location-Details-PickupInstructions-Value").html(location.instructions);

    
    var encludedExtrasAndPrice = ScreenUtils.getBookingExtrasAndPrice(this.reservationExtras, Backend.getBookingConfiguration().locations[this.reservationLocationId].extras);
    $("#ReservationUpdate-Screen-ReservationSummary-Extras-Value").html(encludedExtrasAndPrice[0] == "" ? "none" : encludedExtrasAndPrice[0]);
    
    
    var emailData = {email: this.reservationEmail};
    
    $("#ReservationUpdate-Screen-ReservationSummary-Email-SendButton").click(function() {
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
    
    ScreenUtils.dataModelInput($("#ReservationUpdate-Screen-ReservationSummary-Email-Input")[0], emailData, "email", function(value) {
      $("#ReservationUpdate-Screen-ReservationSummary-Email-SendButton").prop("disabled", !ScreenUtils.isValidEmail(value));
    }, ScreenUtils.isValidEmail);
    
    
    
    $("#ReservationUpdate-Screen-ButtonsPanel-CancelButton").click(function() {
      this._cancelReservation();
    }.bind(this));    
  },
  
  
  
  _cancelReservation: function() {
    var cancellationMessage = "Do you really want to cancel your reservation <b>" + ReservationUpdate.reservationId + "</b>";

    var refund = ReservationUpdate.reservationCost;

    var hoursLeftToTrip = Math.floor((ReservationUpdate.reservationDateTime - ReservationUpdate.currentDate) / 1000 / 60 / 60);

    for (var index in Backend.getBookingConfiguration().cancellation_fees) {
      var fee = Backend.getBookingConfiguration().cancellation_fees[index];
      if (fee.range_min <= hoursLeftToTrip && hoursLeftToTrip < fee.range_max) {
        cancellationMessage += "<br>Since you are cancelling within less than " + fee.range_max + " hours, according to our policy, you will be imposed a fee of $" + fee.price + " dollars. This non-refundable fee will be deducted from the refund.";

        refund -= fee.price;
        if (refund < 0) {
          refund =   0;
        }

        break;
      }
    }

    cancellationMessage += "<br>A refund in the amount of $" + refund + " dollars will be issued to your original payment method.";

    Main.showMessage("Confirm Cancelation", cancellationMessage, function(action) {
      if (action == Main.ACTION_OK) {
        Main.showPopup("Cancellation Processing", "Your cancellation request is being processed.<br>Do not refresh or close your browser");

        Backend.cancelPayment(function(status) {
          if (status == Backend.STATUS_SUCCESS) {
            Backend.cancelReservation(ReservationUpdate.reservationId, function(status) {
              if (status == Backend.STATUS_SUCCESS) {
                Backend.resetReservationContext();
              } else {
                console.error("Refund issued but the reservation is not removed: " + ReservationUpdate.reservationId);
                //TODO: Handle it!
              }


              Main.showMessage("Cancelled", "Your reservation was successfully cancelled, and your original payment method was refunded. You should expect to see your funds in the next 5 business days", function() {
                Main.loadScreen("home");
              });
            });
          } else {
            Main.showMessage("Cancellation Failed", "For some reason we were unable to issue you a refund. Please give us a call and we will assist you with this cancellation.");
          }
        });
      }
    }, Main.DIALOG_TYPE_CONFIRMATION);
  }
}