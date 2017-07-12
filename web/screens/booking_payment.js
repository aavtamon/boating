BookingPayment = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date == null || reservationContext.interval == null || reservationContext.duration == null || reservationContext.location == null) {
      Main.loadScreen("home");
    }

    $("#BookingPayment-Screen-ButtonsPanel-BackButton").click(function() {
      Main.loadScreen("booking_location");
    });
    
    $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").click(function() {
      Main.loadScreen("booking_confirmation");
    });
    
    $("#BookingPayment-Screen-ReservationSummary").html(ScreenUtils.getBookingSummary(Backend.getReservationContext()));
    
    this._canProceedToNextStep();
  },
  
 
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date != null && reservationContext.interval != null && reservationContext.duration != null) {
      $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").removeAttr("disabled");
    } else {
      $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").attr("disabled", true);
    }
  },
}