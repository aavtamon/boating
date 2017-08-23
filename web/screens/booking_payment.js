BookingPayment = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date == null || reservationContext.duration == null || reservationContext.location_id == null || reservationContext.adult_count == null || reservationContext.children_count == null) {
      Main.loadScreen("home");
    }

    $("#BookingPayment-Screen-ButtonsPanel-BackButton").click(function() {
      Main.loadScreen("booking_confirmation");
    });
    
    $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").click(function() {
      Backend.saveReservationContext(function(status) {
        Main.loadScreen("booking_complete");
      });
    });
    
    $("#BookingPayment-Screen-ReservationSummary-Details").html(ScreenUtils.getBookingSummary(reservationContext));
    
    ScreenUtils.phoneInput($("#BookingPayment-Screen-ContactInformation-Contact-CellPhone-Input")[0], reservationContext.mobile_phone, function() {
      this._canProceedToNextStep();
    }.bind(this));

    ScreenUtils.phoneInput($("#BookingPayment-Screen-ContactInformation-Contact-AlternativePhone-Input")[0], null, function() {
      this._canProceedToNextStep();
    }.bind(this));
    
    
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