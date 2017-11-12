ReservationRetrieval = {
  onLoad: function() {
    var reservationInfo = {
      id: Utils.getQueryParameterByName("id"),
      last_name: Utils.getQueryParameterByName("name")
    };
    
    $("#ReservationRetrieval-Screen-Reservation-ButtonPanel-RestoreButton").prop("disabled", true);
    $("#ReservationRetrieval-Screen-Reservation-Status").hide();
    
    function reenableNextButton() {
      var restoreButtonEnabled = $("#ReservationRetrieval-Screen-Reservation-Details-Id-Input").val().length > 0 && $("#ReservationRetrieval-Screen-Reservation-Details-LastName-Input").val().length > 0;
      
      $("#ReservationRetrieval-Screen-Reservation-ButtonPanel-RestoreButton").prop("disabled", !restoreButtonEnabled);
      $("#ReservationRetrieval-Screen-Reservation-Status").hide();
    }
    
    
    ScreenUtils.dataModelInput($("#ReservationRetrieval-Screen-Reservation-Details-Id-Input")[0], reservationInfo, "id", reenableNextButton);
    ScreenUtils.dataModelInput($("#ReservationRetrieval-Screen-Reservation-Details-LastName-Input")[0], reservationInfo, "last_name", reenableNextButton);
    
    $("#ReservationRetrieval-Screen-Reservation-ButtonPanel-RestoreButton").click(this._retrieveReservation);
    
    $("#ReservationRetrieval-Screen-Reservation-ButtonPanel-RestoreButton").click(function() {
      Backend.restoreReservationContext(reservationInfo.id, reservationInfo.last_name, function(status) {
        if (status == Backend.STATUS_SUCCESS) {
          Main.loadScreen("reservation_update");
        } else {
          $("#ReservationRetrieval-Screen-Reservation-Status").show();
        }
      });
    });
    
    
    $("#ReservationRetrieval-Screen-Reservation-Details-Id-Input").focus();
    
    if (reservationInfo.id != "" && reservationInfo.last_name != "") {
      $("#ReservationRetrieval-Screen-Reservation-ButtonPanel-RestoreButton").click();
    }
  },
}

  
