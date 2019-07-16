ReservationUpdate = {
  reservation: null,
  currentDate: null,
  adminAccount: null,
  
  onLoad: function() {
    if (!this.reservation) {
      Main.loadScreen("home");
      
      return;
    }
    
    $("#ReservationUpdate-Screen-ReservationSummary-DateTime-Value").html(ScreenUtils.getBookingDate(this.reservation.slot.time) + " " + ScreenUtils.getBookingTime(this.reservation.slot.time));
    
    var boat = Backend.getBookingConfiguration().locations[this.reservation.location_id].boats[this.reservation.boat_id];
    $("#ReservationUpdate-Screen-ReservationSummary-Boat-Value").html(boat.name);
    
    var location = Backend.getBookingConfiguration().locations[this.reservation.location_id].pickup_locations[this.reservation.pickup_location_id];
    $("#ReservationUpdate-Screen-ReservationSummary-Location-Details-PlaceName-Value").html(location.name);
    $("#ReservationUpdate-Screen-ReservationSummary-Location-Details-PlaceAddress-Value").html(location.address);
    $("#ReservationUpdate-Screen-ReservationSummary-Location-Details-ParkingFee-Value").html(location.parking_fee);
    $("#ReservationUpdate-Screen-ReservationSummary-Location-Details-PickupInstructions-Value").html(location.instructions);

    
    var encludedExtrasAndPrice = ScreenUtils.getBookingExtrasAndPrice(this.reservation.extras, Backend.getBookingConfiguration().locations[this.reservation.location_id].extras);
    $("#ReservationUpdate-Screen-ReservationSummary-Extras-Value").html(encludedExtrasAndPrice[0] == "" ? "none" : encludedExtrasAndPrice[0]);
    
    
    $("#ReservationUpdate-Screen-ReservationSummary-Email-Input").val(this.reservation.email);
    ScreenUtils.form("#ReservationUpdate-Screen-ReservationSummary-Email", null, this._sendReservationConfirmationEmail);    

    $("#ReservationUpdate-Screen-SafetyTest-Email-Input").val(this.reservation.email);
    ScreenUtils.form("#ReservationUpdate-Screen-SafetyTest-Email", null, this._sendSafetyTestCertificationEmail);
    
    $("#ReservationUpdate-Screen-ButtonsPanel-CancelButton").click(function() {
      this._cancelReservation();
    }.bind(this));
  },
  

  _sendReservationConfirmationEmail: function() {
    var email = $("#ReservationUpdate-Screen-ReservationSummary-Email-Input").val();
    
    Main.showPopup("Sending confirmation...", 'Confirmation email is being sent');
    Backend.sendConfirmationEmail(email, function(status) {
      Main.hidePopup();
      if (status == Backend.STATUS_SUCCESS) {
        Main.showMessage("Confirmation email sent", "Reservation confirmation email was sent to <b>" + email + "</b>");
      } else if (status == Backend.STATUS_NOT_FOUND) {
        Main.showMessage("Not Successful", "For some reason the email was not sent. Please try again.");
      } else {
        Main.showMessage("Not Successful", "An error occured. Please try again");
      }
    });
  },
  
  
  _sendSafetyTestCertificationEmail: function() {
    var email = $("#ReservationUpdate-Screen-SafetyTest-Email-Input").val();
    
    Main.showPopup("Sending test results...", 'Safety test results are being sent');
    Backend.emailSafetyTestResults(email, null, null, function(status) {
      Main.hidePopup();
      if (status == Backend.STATUS_SUCCESS) {
        Main.showMessage("Boat Safety certification info is sent", "We sent you the Boat Safety certification status to <b>" + email + "</b>.<br>The email shows the drivers who passed the safety training and can operatre a motor boat.");
      } else if (status == Backend.STATUS_NOT_FOUND) {
        Main.showMessage("Not Successful", "For some reason the email was not sent. Please try again.");
      } else {
        Main.showMessage("Not Successful", "An error occured. Please try again");
      }
    });
  },

  
  
  _cancelReservation: function() {
    var cancellationMessage = "Do you really want to cancel your reservation <b>" + ReservationUpdate.reservation.id + "</b>";

    var refund = ReservationUpdate.reservation.payment_amount;

    var hoursLeftToTrip = Math.floor((ReservationUpdate.reservation.slot.time - ReservationUpdate.currentTime) / 1000 / 60 / 60);

    var matchingFee = null;
    for (var index in Backend.getBookingConfiguration().cancellation_fees) {
      var fee = Backend.getBookingConfiguration().cancellation_fees[index];
      if (fee.range_min <= hoursLeftToTrip && hoursLeftToTrip < fee.range_max) {
        matchingFee = fee;

        break;
      } else {
        if (matchingFee == null || fee.range_min < matchingFee.range_min) {
          matchingFee = fee;
        }
      }
    }
    
    if (hoursLeftToTrip < matchingFee.range_max) {
      cancellationMessage += "<br>Since you are cancelling within less than " + matchingFee.range_max + " hours, according to our policy, you will be imposed a fee of $" + matchingFee.price + " dollars. This non-refundable fee will be deducted from the refund.";

      refund -= matchingFee.price;
      if (refund < 0) {
        refund = 0;
      }
    }
    
    cancellationMessage += "<br>A refund in the amount of $" + refund + " dollars will be issued to your original payment method.";

    Main.showMessage("Confirm Cancelation", cancellationMessage, function(action) {
      if (action == Main.ACTION_OK) {
        Main.showPopup("Cancellation Processing", "Your cancellation request is being processed.<br>Do not refresh or close your browser");

        Backend.refundReservation(function(status) {
          if (status == Backend.STATUS_SUCCESS) {
            Backend.cancelReservation(function(status) {
              Main.hidePopup();
              if (status == Backend.STATUS_SUCCESS) {
                Backend.resetReservationContext();
              } else {
                console.error("Refund issued but the reservation is not removed: " + this.reservation.Id);
                //TODO: Handle it!
              }


              Main.showMessage("Cancelled", "Your reservation was successfully cancelled, and your original payment method was refunded. You should expect to see your funds in the next 5 business days", function() {
                Main.loadScreen("home");
                //history.back();
              });
            }.bind(this));
          } else {
            Main.hidePopup();
            Main.showMessage("Cancellation Failed", "For some reason we were unable to issue you a refund. Please give us a call and we will assist you with this cancellation.");
          }
        }.bind(this));
      }
    }, Main.DIALOG_TYPE_CONFIRMATION);
  },
}