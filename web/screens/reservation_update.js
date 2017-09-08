ReservationUpdate = {
  onLoad: function() {
    var reservationNumber = Utils.getQueryParameterByName("id");
    var lastName = Utils.getQueryParameterByName("name");
    
    $("#ReservationUpdate-Screen-ReservationId-Number-Input").val(reservationNumber);
    $("#ReservationUpdate-Screen-ReservationId-LastName-Input").val(lastName);
    
    $("#ReservationUpdate-Screen-RestoreButton").click(function() {
      reservationNumber = $("#ReservationUpdate-Screen-ReservationId-Number-Input").val();
      lastName = $("#ReservationUpdate-Screen-ReservationId-LastName-Input").val();
      
      Backend.restoreReservationContext(reservationNumber, lastName, function(status) {
        if (status == Backend.STATUS_SUCCESS) {
          Main.loadScreen("booking_time");
        } else {
          $("#ReservationUpdate-Screen-ReservationNumber-Status").html("Failed to retrieve the object");
        }
      });
    });
  },
}