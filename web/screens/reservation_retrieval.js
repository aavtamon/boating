ReservationRetrieval = {
  onLoad: function() {
    var id = Utils.getQueryParameterByName("id");
    var lastName = Utils.getQueryParameterByName("name");
    
    if (id != "") {
      $("#ReservationRetrieval-Screen-Reservation-Details-Id-Input").val(id);
    }
    if (lastName != "") {
      $("#ReservationRetrieval-Screen-Reservation-Details-LastName-Input").val(lastName);
    }

    $("#ReservationRetrieval-Screen-Reservation-Status").hide();
    $("#ReservationRetrieval-Screen-Reservation-Details-Id-Input").focus();
    
    if ($("#ReservationRetrieval-Screen-Reservation-Details-Id-Input").val() != "" && $("#ReservationRetrieval-Screen-Reservation-Details-LastName-Input").val() != "") {
      this.retrieve();
    }
    
    $("#ReservationRetrieval-Screen-Reservation-Details-Id-Input").change(function() {
      $("#ReservationRetrieval-Screen-Reservation-Details-Id-Input").val($("#ReservationRetrieval-Screen-Reservation-Details-Id-Input").val().toUpperCase());
    })
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

  
