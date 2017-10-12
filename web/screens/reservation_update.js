ReservationUpdate = {
  currentDate: null,
  cancellationFees: null,
  
  onLoad: function() {
    $("#ReservationUpdate-Screen-ButtonsPanel-CancelButton").click(function() {
      var cancellationMessage = "Do you really want to cancel your reservation <b>" + Backend.getReservationContext().id + "</b>";
      
      var refund = Backend.getReservationContext().slot.price;

      var hoursLeftToTrip = Math.floor((Backend.getReservationContext().slot.time - ReservationUpdate.currentDate) / 1000 / 60 / 60);
      var matchingHours = null;
      for (var hours in ReservationUpdate.cancellationFees) {
        if (hours > hoursLeftToTrip) {
          if (matchingHours == null || matchingHours > hours) {
            matchingHours = hours;
          }
        }
      }
      if (matchingHours != null) {
        cancellationMessage += "<br>Since you are cancelling within less than " + matchingHours + " hours, according to our policy, you will be imposed a fee of $" + ReservationUpdate.cancellationFees[matchingHours] + " dollars. This non-refundable fee will be deducted from the refund.";
        
        refund -= ReservationUpdate.cancellationFees[matchingHours];
      }
      
      cancellationMessage += "<br>A refund in the amount of $" + refund + " dollars will be issued to your original payment method.";
      
      
      Main.showMessage("Confirm Cancelation", cancellationMessage, function(action) {
        if (action == Main.ACTION_OK) {
          Main.showPopup("Cancellation Processing", "Your cancellation request is being processed.<br>Do not refresh or close your browser");
          
          Backend.cancelPayment(function(status) {
            if (status == Backend.STATUS_SUCCESS) {
              Backend.removeReservation(Backend.getReservationContext().id, function(status) {
                if (status == Backend.STATUS_SUCCESS) {
                } else {
                  console.error("Refund issued but the reservation is not removed: " + Backend.getReservationContext().id);
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
    });
    
  }
}