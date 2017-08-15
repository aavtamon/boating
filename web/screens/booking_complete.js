BookingComplete = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.payed == null) {
      Main.loadScreen("home");
    }
  },
}