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
    
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-DepositButton").hide();
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-CompleteButton").hide();
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-FinishButton").hide();
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-Complete").hide();
    
    
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-DepositButton").click(function() {
      if (this._selectedRentalElement != null) {
        Backend.restoreReservationContext(this._selectedRentalElement._reservationId, null, function(status) {
          if (status == Backend.STATUS_SUCCESS) {
            Main.loadScreen("admin_deposit");
          } else {
            Main.showMessage("Reservation Not Found", "Reservation can not be retrieved.");
          }
        }.bind(this));
      }
    }.bind(this));
    
    
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-FinishButton").click(function() {
      if (this._selectedRentalElement != null) {
        Main.showMessage("Accident Settled?", "<center>Are you sure you want to mark this accident settled?</center>", function(action) {
          if (action == Main.ACTION_YES) {
            Main.showPopup("Updating...", "Reservation status is being updated.");

            Backend.restoreReservationContext(this._selectedRentalElement._reservationId, null, function(status) {
              if (status == Backend.STATUS_SUCCESS) {
                Backend.getReservationContext().status = Backend.RESERVATION_STATUS_COMPLETED;

                Backend.saveReservation(function(status) {
                  if (status == Backend.STATUS_SUCCESS) {
                    Main.hidePopup();
                    this._selectedRentalElement._rental.status = Backend.getReservationContext().status;
                    Backend.resetReservationContext();

                    this._showRentals();
                  } else {
                    Backend.resetReservationContext();
                    Main.showMessage("Update Not Successful", "Reservation can not be updated.");
                  }
                }.bind(this));
              } else {
                Main.showMessage("Reservation Not Found", "Reservation can not be retrieved.");
              }
            }.bind(this));
          }
        }.bind(this), Main.DIALOG_TYPE_YESNO);
      }
    }.bind(this));
    
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-CompleteButton").click(function() {
      Backend.restoreReservationContext(this._selectedRentalElement._reservationId, null, function(status) {
        if (status == Backend.STATUS_SUCCESS) {
          Main.loadScreen("admin_completion");
        } else {
          Main.showMessage("Reservation Not Found", "Reservation can not be retrieved.");
        }
      }.bind(this));
    }.bind(this));
    
    this._showRentals();
  },
  
  
  _showRentals: function() {
    var optionsSelector = $("#AdminHome-Screen-AdminInfo-BoatRentals-Rentals");
    optionsSelector.empty();
    
    var upcomingRentals = [];
    var inprocessRentals = [];
    var accidentRentals = [];
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

        this._showRentalDetails(event.target);
      }.bind(this));
      
      if (rental.status == Backend.RESERVATION_STATUS_BOOKED) {
        upcomingRentals.push(rentalOption[0]);
      } else if (rental.status == Backend.RESERVATION_STATUS_DEPOSITED) {
        inprocessRentals.push(rentalOption[0]);
      } else if (rental.status == Backend.RESERVATION_STATUS_ACCIDENT) {
        accidentRentals.push(rentalOption[0]);
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
    accidentRentals.sort(sortFunction);
    completedRentals.sort(sortFunction);

    
    var upcomingRentalsGroup = $("<div class=\"optionbox-optiongroup\"><div class=\"optionbox-optiongroup-title\">Upcoming rentals</div></div>").appendTo(optionsSelector);
    var inprocessRentalsGroup = $("<div class=\"optionbox-optiongroup\"><div class=\"optionbox-optiongroup-title\">In-process rentals</div></div>").appendTo(optionsSelector);
    if (accidentRentals.length > 0) {
      var accidentRentalsGroup = $("<div class=\"optionbox-optiongroup\"><div class=\"optionbox-optiongroup-title highlight\">Accident rentals</div></div>").appendTo(optionsSelector);
    }
    var completedRentalsGroup = $("<div class=\"optionbox-optiongroup\"><div class=\"optionbox-optiongroup-title\">Completed rentals</div></div>").appendTo(optionsSelector);
    
    
    for (var i in upcomingRentals) {
      $(upcomingRentals[i]).appendTo(upcomingRentalsGroup);
    }
    
    for (var i in inprocessRentals) {
      $(inprocessRentals[i]).appendTo(inprocessRentalsGroup);
    }
    
    for (var i in accidentRentals) {
      $(accidentRentals[i]).appendTo(accidentRentalsGroup);
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
  
  
  _showRentalDetails: function(rentalElement) {
    this._selectedRentalElement = rentalElement;
    rental = rentalElement._rental;
    
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Date-Value").html(ScreenUtils.getBookingDate(rental.slot.time));
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Time-Value").html(ScreenUtils.getBookingTime(rental.slot.time));
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Duration-Value").html(ScreenUtils.getBookingDuration(rental.slot.duration));
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Location-Value").html(Backend.getBookingConfiguration().locations[rental.location_id].name);
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Boat-Value").html(Backend.getBookingConfiguration().locations[rental.location_id].boats[rental.boat_id].name);

    
    reservationId = "";
    if (rental.status == Backend.RESERVATION_STATUS_COMPLETED) {
      reservationId = rentalElement._reservationId;
    } else {
      reservationId = "<a href='javascript:AdminHome._loadReservationScreen(\"" + rentalElement._reservationId + "\", \"" + rental.last_name + "\", \"reservation_update\")'>" + rentalElement._reservationId + "</a>";
    }
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Reservation-Value").html(reservationId);
    
    var safetyTest = "";
    if (rental.safety_test != null) {
      safetyTest = "valid thru " + ScreenUtils.getBookingDate(rental.safety_test.expiration_date);
    } else if (rental.status == Backend.RESERVATION_STATUS_COMPLETED) {
      safetyTest = "Not taken!";
    } else {
      safetyTest = "<a href='javascript:AdminHome._loadReservationScreen(\"" + rentalElement._reservationId + "\", \"" + rental.last_name + "\", \"safety_tips\")'>Not taken!</a>";
    }
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-SafetyTest-Value").html(safetyTest);

    if (rental.status == Backend.RESERVATION_STATUS_BOOKED) {
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-DepositButton").show();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-CompleteButton").hide();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-FinishButton").hide();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-Complete").hide();
    } else if (rental.status == Backend.RESERVATION_STATUS_DEPOSITED) {
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-DepositButton").hide();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-CompleteButton").show();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-FinishButton").hide();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-Complete").hide();
    } else if (rental.status == Backend.RESERVATION_STATUS_ACCIDENT) {
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-DepositButton").hide();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-CompleteButton").hide();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-FinishButton").show();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-Complete").hide();
    } else if (rental.status == Backend.RESERVATION_STATUS_COMPLETED) {
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-DepositButton").hide();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-CompleteButton").hide();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-FinishButton").hide();
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-Complete").show();
    }
    
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-DepositButton").prop('disabled', rental.safety_test == null);
  },
  
  
  _loadReservationScreen: function(reservationId, lastName, screen) {
    Backend.restoreReservationContext(reservationId, lastName, function(status) {
      if (status == Backend.STATUS_SUCCESS) {
        Main.loadScreen(screen);
      } else {
        Main.showPopup("Operation failed", "Failed to retrieve the referenced reservation");
      }
    });
  }
}