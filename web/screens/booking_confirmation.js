BookingPayment = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date == null || reservationContext.interval == null || reservationContext.duration == null || reservationContext.location == null) {
//      Main.loadScreen("home");
    }
    
    $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").checkboxradio();
    $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector").selectmenu();
    $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector").selectmenu();
    
    $("#BookingPayment-Screen-ButtonsPanel-BackButton").click(function() {
      Main.loadScreen("booking_location");
    });
    
    $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").click(function() {
      Main.loadScreen("booking_confirmation");
    });
    
//    $("#BookingPayment-Screen-ReservationSummary").html(ScreenUtils.getBookingSummary(Backend.getReservationContext()));
    
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