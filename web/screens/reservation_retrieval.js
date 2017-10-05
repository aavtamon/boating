ReservationRetrieval = {
  onLoad: function() {
    var reservationNumber = Utils.getQueryParameterByName("id");
    var lastName = Utils.getQueryParameterByName("name");
    
    if (reservationNumber != null && lastName != null) {
      Backend.restoreReservationContext(reservationNumber, lastName, function(status) {
        if (status == Backend.STATUS_SUCCESS) {
          Main.loadScreen("reservation_update");
        }
      });
    }
    
    $("#ReservationRetrieval-Screen-RestoreButton").click(function() {
      $("#ReservationRetrieval-Screen-Status").val("");
      
      reservationNumber = $("#ReservationRetrieval-Screen-ReservationId-Number-Input").val();
      lastName = $("#ReservationRetrieval-Screen-ReservationId-LastName-Input").val();
      
      Backend.restoreReservationContext(reservationNumber, lastName, function(status) {
        if (status == Backend.STATUS_SUCCESS) {
          Main.loadScreen("reservation_update");
        } else {
          $("#ReservationRetrieval-Screen-Status").val("Failed to retieve reservation. Please check your confirmation number and last name");
        }
      });
    });
  },
}