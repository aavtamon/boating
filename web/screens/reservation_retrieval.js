ReservationRetrieval = {
  onLoad: function() {
    var reservationId = Utils.getQueryParameterByName("id");
    var lastName = Utils.getQueryParameterByName("name");
    
    if (reservationId != null && lastName != null) {
      ScreenUtils.retrieveReservation(reservationId, lastName);
    }
    
    $("#ReservationRetrieval-Screen-Reservation-ButtonPanel-RestoreButton").prop("disabled", true);
    $("#ReservationRetrieval-Screen-Reservation-Status").hide();
    
    function reenableNextButton() {
      var restoreButtonEnabled = $("#ReservationRetrieval-Screen-Reservation-Number-Input").val().length > 0 && $("#ReservationRetrieval-Screen-Reservation-LastName-Input").val().length > 0;
      
      $("#ReservationRetrieval-Screen-Reservation-ButtonPanel-RestoreButton").prop("disabled", !restoreButtonEnabled);
      $("#ReservationRetrieval-Screen-Reservation-Status").hide();
    }
    
    
    var reservationInfo = {};
    
    ScreenUtils.dataModelInput($("#ReservationRetrieval-Screen-Reservation-Number-Input")[0], reservationInfo, "id", reenableNextButton);
    ScreenUtils.dataModelInput($("#ReservationRetrieval-Screen-Reservation-LastName-Input")[0], reservationInfo, "last_name", reenableNextButton);
    
    
    $("#ReservationRetrieval-Screen-Reservation-ButtonPanel-RestoreButton").click(function() {
      Backend.restoreReservationContext(reservationInfo.id, reservationInfo.last_name, function(status) {
        if (status == Backend.STATUS_SUCCESS) {
          Main.loadScreen("reservation_update");
        } else {
          $("#ReservationRetrieval-Screen-Reservation-Status").show();
        }
      });
    });
    
    
    $("#ReservationRetrieval-Screen-Reservation-Number-Input").focus();
  },
}