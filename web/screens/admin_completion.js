AdminCompletion = {
  totalRefund: 0,
  
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();

    if (reservationContext.status != Backend.RESERVATION_STATUS_DEPOSITED) {
      Backend.resetReservationContext();
      Main.loadScreen("admin_home");
      
      return;
    }
    
    $("#AdminCompletion-Screen-Description-BackButton").click(function() {
      Backend.resetReservationContext();
      Main.loadScreen("admin_home");
    });
    
    var boat = Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id];
    $("#AdminCompletion-Screen-ReservationSummary-Boat-Value").html(boat.name);
    $("#AdminCompletion-Screen-ReservationSummary-Deposit-Value").html(ScreenUtils.getBookingPrice(boat.deposit));
    
    $("#AdminCompletion-Screen-FuelUsage-Input").change(this.updateTotalRefund.bind(this));
    $("#AdminCompletion-Screen-AccidentStatus-Input").change(this.updateTotalRefund.bind(this));
    
    $("#AdminCompletion-Screen-Description-ConfirmButton").click(function() {
      if ($("#AdminCompletion-Screen-AccidentStatus-Input").val() == "yes") {
        Main.showMessage("Report Accident", "Are you sure - report an accident and provide NO REFUND??", function(action) {
          if (action == Main.ACTION_YES) {
            this.reportAccident();
          }
        }.bind(this), Main.DIALOG_TYPE_YESNO);        
      } else {
        Main.showMessage("Complete Rental", "Are you sure - complete rental and refund back " + ScreenUtils.getBookingPrice(this.totalRefund) + "?", function(action) {
          if (action == Main.ACTION_YES) {
            this.completeRental();
          }
        }.bind(this), Main.DIALOG_TYPE_YESNO);
      }
    }.bind(this));
    
    this.updateTotalRefund();
  },
  
  updateTotalRefund: function() {
    var reservationContext = Backend.getReservationContext();
    var boat = Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id];
    
    this.totalRefund = 0;
    var totalRefundString = "";
    var hadAccident = $("#AdminCompletion-Screen-AccidentStatus-Input").val() == "yes";
    if (!hadAccident) {
      this.totalRefund = boat.deposit - Math.round(Backend.getBookingConfiguration().gas_price * boat.tank_size * $("#AdminCompletion-Screen-FuelUsage-Input").val() / 100);
      totalRefundString = ScreenUtils.getBookingPrice(boat.deposit) + " - (" +  ScreenUtils.getBookingPrice(Backend.getBookingConfiguration().gas_price) + " per gallon * " + $("#AdminCompletion-Screen-FuelUsage-Input").val() + "% of tank * " + boat.tank_size + " gallons) = " + ScreenUtils.getBookingPrice(this.totalRefund);
    } else {
      totalRefundString = "$0 - ATTENTION: No Refund!!!";
    }
    $("#AdminCompletion-Screen-TotalRefund-Value").html(totalRefundString);      
  },
  
  
  completeRental: function() {
    Main.showPopup("Updating...", "Reservation status is being updated.");

    Backend.getReservationContext().fuel_usage = parseInt($("#AdminCompletion-Screen-FuelUsage-Input").val());
    Backend.saveReservation(function(status) {
      if (status == Backend.STATUS_SUCCESS) {
        Backend.refundDeposit(function(status) {
          if (status == Backend.STATUS_SUCCESS) {
            Backend.getReservationContext().status = Backend.RESERVATION_STATUS_COMPLETED;

            Backend.saveReservation(function(status) {
              if (status == Backend.STATUS_SUCCESS) {
                Main.hidePopup();
                Backend.resetReservationContext();
                Main.loadScreen("admin_home");
              } else {
                Main.showMessage("Update Not Successful", "Reservation can not be completed.");
              }
            }.bind(this));
          } else {
            Main.showMessage("Deposit Refund Not Successful", "Deposit was not refunded.");
          }
        }.bind(this));  
      } else {
        Main.showMessage("Update Not Successful", "Fuel usage can not be updated.");
      }
    }.bind(this));
  },
  
  reportAccident: function() {
    Main.showPopup("Updating...", "Reservation status is being updated.");

    Backend.getReservationContext().status = Backend.RESERVATION_STATUS_ACCIDENT;

    Backend.saveReservation(function(status) {
      if (status == Backend.STATUS_SUCCESS) {
        Main.hidePopup();
        Backend.resetReservationContext();
        Main.loadScreen("admin_home");
      } else {
        Main.showMessage("Update Not Successful", "Reservation can not be updated.");
      }
    }.bind(this));
  }
}