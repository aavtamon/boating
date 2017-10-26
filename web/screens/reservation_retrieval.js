ReservationRetrieval = {
  onLoad: function() {
    var reservationId = Utils.getQueryParameterByName("id");
    var lastName = Utils.getQueryParameterByName("name");
    
    if (reservationId != null && lastName != null) {
      this.retrieveReservation(reservationId, lastName);
    }
    
    $("#ReservationRetrieval-Screen-ReservationId-ButtonPanel-RestoreButton").prop("disabled", true);
    $("#ReservationRetrieval-Screen-ReservationId-Status").hide();
    
    function reenableNextButton() {
      var nextButtonEnabled = $("#ReservationRetrieval-Screen-ReservationId-Number-Input").val().length > 0 && $("#ReservationRetrieval-Screen-ReservationId-LastName-Input").val().length > 0;
      
      $("#ReservationRetrieval-Screen-ReservationId-ButtonPanel-RestoreButton").prop("disabled", !nextButtonEnabled);
      $("#ReservationRetrieval-Screen-ReservationId-Status").hide();
    }
    
    $("#ReservationRetrieval-Screen-ReservationId-Number-Input").bind("input", reenableNextButton);
    $("#ReservationRetrieval-Screen-ReservationId-LastName-Input").bind("input", reenableNextButton);
    
    $("#ReservationRetrieval-Screen-ReservationId-ButtonPanel-RestoreButton").click(function() {
      reservationNumber = $("#ReservationRetrieval-Screen-ReservationId-Number-Input").val();
      lastName = $("#ReservationRetrieval-Screen-ReservationId-LastName-Input").val();
      
      $("#ReservationRetrieval-Screen-ReservationId-ButtonPanel-RestoreButton").prop("disabled", true);
      Backend.restoreReservationContext(reservationNumber, lastName, function(status) {
        if (status == Backend.STATUS_SUCCESS) {
          Main.loadScreen("reservation_update");
        } else {
          $("#ReservationRetrieval-Screen-ReservationId-Status").show();
        }
      });
    });
    
    
    $("#ReservationRetrieval-Screen-ReservationId-Number-Input").focus();
  },
  
  
  retrieveReservation: function(reservationId, lastName) {
    Backend.restoreReservationContext(reservationId, lastName, function(status) {
      if (status == Backend.STATUS_SUCCESS) {
        Main.loadScreen("reservation_update");
      }
    });
  }
}