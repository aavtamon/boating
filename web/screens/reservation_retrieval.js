ReservationRetrieval = {
  onLoad: function() {
    $("#ReservationRetrieval-Screen-Reservation-Details-Id-Input").val(Utils.getQueryParameterByName("id"));
    $("#ReservationRetrieval-Screen-Reservation-Details-LastName-Input").val(Utils.getQueryParameterByName("name"));

    $("#ReservationRetrieval-Screen-Reservation-Status").hide();
    $("#ReservationRetrieval-Screen-Reservation-Details-Id-Input").focus();
    
    if ($("#ReservationRetrieval-Screen-Reservation-Details-Id-Input").val() != "" && $("#ReservationRetrieval-Screen-Reservation-Details-LastName-Input").val() != "") {
      this.retrieve();
    }
  },
  
  retrieve: function() {
    Backend.restoreReservationContext($("#ReservationRetrieval-Screen-Reservation-Details-Id-Input").val(), $("#ReservationRetrieval-Screen-Reservation-Details-LastName-Input").val(), function(status) {
      if (status == Backend.STATUS_SUCCESS) {
        var action = Utils.getQueryParameterByName("action") || "reservation_update";
        Main.loadScreen(action);
      } else {
        $("#ReservationRetrieval-Screen-Reservation-Status").show();
      }
    });
  }
}

  
