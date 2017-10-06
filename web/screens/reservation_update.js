ReservationUpdate = {
  onLoad: function() {
    $("#ReservationUpdate-Screen-ButtonsPanel-CancelButton").click(function() {
      Main.showMessage("Confirm Cancelation", "Do you really want to cancel your reservation <b>" + Backend.getReservationContext().id + "</b>", function(action) {
        if (action == Main.ACTION_OK) {
          Backend.removeReservation(Backend.getReservationContext().id, function(status) {
            if (status == Backend.STATUS_SUCCESS) {
              Main.showMessage("Cancelled", "Your reservation was successfully cancelled", function() {
                Main.loadScreen("home");
              });
            } else {
              Main.showMessage("Cancellation Failed", "For some reason we failed to cancel your reservation.<br>Please try again.<br>If the problem persists, please give us a call");
            }
          });
        }
      }, Main.DIALOG_TYPE_CONFIRMATION);
    });
    
  }
}