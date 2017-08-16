ReservationUpdate = {
  onLoad: function() {
    $("#ReservationUpdate-Screen-ReservationNumber-RestoreButton").click(function() {
      Backend.restoreReservationContext(function(status) {
        if (status == Backend.STATUS_SUCCESS) {
          Main.loadScreen("booking_time");
        } else {
          $("#ReservationUpdate-Screen-ReservationNumber-Status").html("Failed to retrieve the object");
        }
      });
    });
  },
}