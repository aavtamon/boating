AdminCompletion = {
  totalRefund: 0,
  
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();

    if (reservationContext.status != Backend.RESERVATION_STATUS_DEPOSITED) {
      Main.loadScreen("admin_home");
      
      return;
    }
    
    $("#AdminCompletion-Screen-Description-BackButton").click(function() {
      Main.loadScreen("admin_home");
    });
    
    var boat = Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id];
    $("#AdminCompletion-Screen-ReservationSummary-Boat-Value").html(boat.name);
    $("#AdminCompletion-Screen-ReservationSummary-Deposit-Value").html(ScreenUtils.getBookingPrice(boat.deposit));
    
    $("#AdminCompletion-Screen-FuelUsage-Input").change(this.updateTotalRefund);
    $("#AdminCompletion-Screen-AccidentStatus-Input").change(this.updateTotalRefund);
    
    $("#AdminCompletion-Screen-Description-ConfirmButton").click(function() {
    });
    
    this.updateTotalRefund();
  },
  
  updateTotalRefund: function() {
    var reservationContext = Backend.getReservationContext();
    var boat = Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id];
    
    totalRefund = 0;
    var totalRefundString = "";
    var hadAccident = $("#AdminCompletion-Screen-AccidentStatus-Input").val() == "yes";
    if (!hadAccident) {
      totalRefund = boat.deposit - Math.round(Backend.getBookingConfiguration().gas_price * boat.tank_size * $("#AdminCompletion-Screen-FuelUsage-Input").val() / 100);
      totalRefundString = ScreenUtils.getBookingPrice(boat.deposit) + " - (" +  ScreenUtils.getBookingPrice(Backend.getBookingConfiguration().gas_price) + " per gallon * " + $("#AdminCompletion-Screen-FuelUsage-Input").val() + "% of tank * " + boat.tank_size + " gallons) = " + ScreenUtils.getBookingPrice(totalRefund);
    } else {
      totalRefundString = "$0 - ATTENTION: No Refund!!!";
    }
    $("#AdminCompletion-Screen-TotalRefund-Value").html(totalRefundString);      
  }
}