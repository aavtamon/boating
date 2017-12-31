AdminHome = {
  adminAccount: null,
  rentalStat: null,
  
  _selectedRentalElement: null,
  
  onLoad: function() {
    if (this.adminAccount == null || this.adminAccount.type != Backend.OWNER_ACCOUNT_TYPE_ADMIN) {
      Main.loadScreen("owner_login");
      return;
    }
    
    
    $("#AdminHome-Screen-Description-LogoutButton").click(function() {
      Backend.logOut(function() {
        Main.loadScreen("owner_login");
      });
    });
    
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-DepositButton").click(function() {
      if (this._selectedRentalElement != null) {
        Main.showPopup("Updating...", "Reservation status is being updated.");
        
        Backend.restoreReservationContext(this._selectedRentalElement._reservationId, null, function(status) {
          if (status == Backend.STATUS_SUCCESS) {
            Main.loadScreen("admin_deposit");
          } else {
            Main.showMessage("Update Not Successful", "Reservation can not be retrieved.");
          }
        }.bind(this));
      }
    }.bind(this));
    
    
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-CompleteButton").click(function() {
      if (this._selectedRentalElement != null) {
        Main.showMessage("Successful Rental Completion", "By clicking OK you certify that the boat was returned in the original condition, no any accidents occured, and that the deposit can be released in full.", function(action) {
          if (action == Main.ACTION_OK) {
            Main.showPopup("Updating...", "Reservation status is being updated.");

            Backend.restoreReservationContext(this._selectedRentalElement._reservationId, null, function(status) {
              if (status == Backend.STATUS_SUCCESS) {
                Backend.refundDeposit(function(status) {
                  if (status == Backend.STATUS_SUCCESS) {
                    Backend.getReservationContext().status = Backend.RESERVATION_STATUS_COMPLETED;

                    Backend.saveReservation(function(status) {
                      if (status == Backend.STATUS_SUCCESS) {
                        Main.hidePopup();
                        this._selectedRentalElement._rental.status = Backend.getReservationContext().status;
                        Backend.resetReservationContext();

                        this._showRentals();
                      } else {
                        Main.showMessage("Update Not Successful", "Reservation can not be updated.");
                      }
                    }.bind(this));
                  } else {
                    Main.showMessage("Deposit Refund Not Successful", "Deposit was not refunded.");
                  }
                }.bind(this));
              } else {
                Main.showMessage("Update Not Successful", "Reservation can not be retrieved.");
              }
            }.bind(this));
          }
        }.bind(this), Main.DIALOG_TYPE_CONFIRMATION);
      }
    }.bind(this));
    
    
    this._showRentals();
  },
  
  _showRentals: function() {
    var optionsSelector = $("#AdminHome-Screen-AdminInfo-BoatRentals-Rentals");
    optionsSelector.empty();
    
    var upcomingRentals = [];
    var inprocessRentals = [];
    var completedRentals = [];
    for (var reservationId in this.rentalStat.rentals) {
      var rental = this.rentalStat.rentals[reservationId];
      
      var rentalInfo = ScreenUtils.getBookingDate(rental.slot.time) + ", " + ScreenUtils.getBookingDuration(rental.slot.duration);
      var rentalOption = $("<div class=\"optionbox-option rentals\">" + rentalInfo + "</div>");
      
      rentalOption[0]._rental = rental;
      rentalOption[0]._reservationId = reservationId;

      rentalOption.click(function(event) {
        $(".rentals").removeClass("selected");
        $(event.target).addClass("selected");

        this._showSlotDetails(event.target);
      }.bind(this));
      
      if (rental.status == Backend.RESERVATION_STATUS_BOOKED) {
        upcomingRentals.push(rentalOption[0]);
      } else if (rental.status == Backend.RESERVATION_STATUS_DEPOSITED) {
        inprocessRentals.push(rentalOption[0]);
      } else if (rental.status == Backend.RESERVATION_STATUS_COMPLETED) {
        completedRentals.push(rentalOption[0]);
      } else {
        console.error("Unexpected reservation status: " + rental.status + " of reservation " + reservationId);
      }
    }

    
    sortFunction = function(option1, option2) {
      return option1._rental.slot.time - option2._rental.slot.time;
    }
    
    upcomingRentals.sort(sortFunction);
    inprocessRentals.sort(sortFunction);
    completedRentals.sort(sortFunction);

    
    var upcomingRentalsGroup = $("<div class=\"optionbox-optiongroup\"><div class=\"optionbox-optiongroup-title\">Upcoming rentals</div></div>").appendTo(optionsSelector);
    var inprocessRentalsGroup = $("<div class=\"optionbox-optiongroup\"><div class=\"optionbox-optiongroup-title\">In-process rentals</div></div>").appendTo(optionsSelector);
    var completedRentalsGroup = $("<div class=\"optionbox-optiongroup\"><div class=\"optionbox-optiongroup-title\">Completed rentals</div></div>").appendTo(optionsSelector);
    
    for (var i in upcomingRentals) {
      $(upcomingRentals[i]).appendTo(upcomingRentalsGroup);
    }
    
    for (var i in inprocessRentals) {
      $(inprocessRentals[i]).appendTo(inprocessRentalsGroup);
    }
    
    for (var i in completedRentals) {
      $(completedRentals[i]).appendTo(completedRentalsGroup);
    }
    
    
    if ($(".rentals").length > 0) {
      $(".rentals")[0].click();
    }

    if (upcomingRentalsGroup.children().length == 1) {
      $("<div class=\"optionbox-nooption\">None</div>").appendTo(upcomingRentalsGroup);
    }
    if (inprocessRentalsGroup.children().length == 1) {
      $("<div class=\"optionbox-nooption\">None</div>").appendTo(inprocessRentalsGroup);
    }
    if (completedRentalsGroup.children().length == 1) {
      $("<div class=\"optionbox-nooption\">None</div>").appendTo(completedRentalsGroup);
    }
  },
  
  
  _showSlotDetails: function(rentalElement) {
    this._selectedRentalElement = rentalElement;
    rental = rentalElement._rental;
    
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Date-Value").html(ScreenUtils.getBookingDate(rental.slot.time));
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Time-Value").html(ScreenUtils.getBookingTime(rental.slot.time));
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Duration-Value").html(ScreenUtils.getBookingDuration(rental.slot.duration));
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Location-Value").html(Backend.getBookingConfiguration().locations[rental.location_id].name);
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Boat-Value").html(Backend.getBookingConfiguration().locations[rental.location_id].boats[rental.boat_id].name);
    
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Reservation-Value").html(rentalElement._reservationId);

    if (rental.status == Backend.RESERVATION_STATUS_BOOKED) {
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-DepositButton").show();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-CompleteButton").hide();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-Complete").hide();
    } else if (rental.status == Backend.RESERVATION_STATUS_DEPOSITED) {
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-DepositButton").hide();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-CompleteButton").show();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-Complete").hide();
    } else if (rental.status == Backend.RESERVATION_STATUS_COMPLETED) {
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-DepositButton").hide();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-CompleteButton").hide();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-Complete").show();
    }
  },
}