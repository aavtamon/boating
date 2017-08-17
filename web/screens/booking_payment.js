BookingPayment = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date == null || reservationContext.duration == null || reservationContext.location_id == null || reservationContext.adult_count == null || reservationContext.children_count == null) {
      Main.loadScreen("home");
    }

    $("#BookingPayment-Screen-ButtonsPanel-BackButton").click(function() {
      Main.loadScreen("booking_location");
    });
    
    $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").click(function() {
      Backend.saveReservationContext(function(status) {
        Main.loadScreen("booking_complete");
      });
    });
    
    $("#BookingPayment-Screen-ReservationSummary").html(ScreenUtils.getBookingSummary(Backend.getReservationContext()));
    
    this._canProceedToNextStep();
  },
  
 
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date != null && reservationContext.duration != null && reservationContext.location_id != null) {
      $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").removeAttr("disabled");
    } else {
      $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").attr("disabled", true);
    }
  },
}