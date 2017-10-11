ReservationUpdate = {
  onLoad: function() {
    $("#ReservationUpdate-Screen-ButtonsPanel-CancelButton").click(function() {
      Main.showMessage("Confirm Cancelation", "Do you really want to cancel your reservation <b>" + Backend.getReservationContext().id + "</b>", function(action) {
        if (action == Main.ACTION_OK) {
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