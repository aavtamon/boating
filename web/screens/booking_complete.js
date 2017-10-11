BookingComplete = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (!Backend.isPayedReservation()) {
      Main.loadScreen("home");
    }
  },
}