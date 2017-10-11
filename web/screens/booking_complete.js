BookingComplete = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.payment_status != Backend.PAYMENT_STATUS_PAYED) {
      Main.loadScreen("home");
    }
    
    // Once complete we should not be able to revisit this reservation
    Backend.resetReservationContext();
  },
}