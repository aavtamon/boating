AdminHome = {
  adminAccount: null,
  rentalStat: null,
  
  _selectedReservationId: null,
  
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
    
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-Button").click(function() {
      if (this._selectedReservationId != null) {
        Main.showPopup("Updating...", "Reservation status is being updated.");
        
        Backend.restoreReservationContext(this._selectedReservationId, null, function(status) {
          if (status == Backend.STATUS_SUCCESS) {
            if (Backend.getReservationContext().status == Backend.RESERVATION_STATUS_BOOKED) {
              Backend.getReservationContext().status = Backend.RESERVATION_STATUS_COMPLETED;
            } else if (Backend.getReservationContext().status == Backend.RESERVATION_STATUS_COMPLETED) {
              Backend.getReservationContext().status = Backend.RESERVATION_STATUS_BOOKED;
            }
            Backend.saveReservation(function() {
              if (status == Backend.STATUS_SUCCESS) {
                Main.hidePopup();
                // TODO: update
              } else {
                Main.showMessage("Update Not Successful", "Reservation can not be updated.");
              }
            })
          } else {
            Main.showMessage("Update Not Successful", "Reservation can not be retrieved.");
          }
        });
      }
    }.bind(this));
    
    this._showRentals();
  },
  
  _showRentals: function() {
    var optionsSelector = $("#AdminHome-Screen-AdminInfo-BoatRentals-Rentals");
    optionsSelector.empty();
    

    
    var upcomingRentals = [];
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
      } else {
        completedRentals.push(rentalOption[0]);
      }
    }
    
    upcomingRentals.sort(function(option1, option2) {
      return option1._rental.slot.time - option2._rental.slot.time;
    });
    completedRentals.sort(function(option1, option2) {
      return option2._rental.slot.time - option1._rental.slot.time;
    });

    
    var upcomingRentalsGroup = $("<div class=\"optionbox-optiongroup\"><div class=\"optionbox-optiongroup-title\">Upcoming rentals</div></div>").appendTo(optionsSelector);
    var completedRentalsGroup = $("<div class=\"optionbox-optiongroup\"><div class=\"optionbox-optiongroup-title\">Completed rentals</div></div>").appendTo(optionsSelector);
    
    for (var i in upcomingRentals) {
      $(upcomingRentals[i]).appendTo(upcomingRentalsGroup);
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
    if (completedRentalsGroup.children().length == 1) {
      $("<div class=\"optionbox-nooption\">None</div>").appendTo(completedRentalsGroup);
    }
  },
  
  
  _showSlotDetails: function(rentalElement) {
    console.debug("Showing rental details... " + this._selectedReservationId)
    console.debug(rentalElement._rental)
    
    this._selectedReservationId = rentalElement._reservationId;
    rental = rentalElement._rental;
    
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Date-Value").html(ScreenUtils.getBookingDate(rental.slot.time));
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Time-Value").html(ScreenUtils.getBookingTime(rental.slot.time));
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Duration-Value").html(ScreenUtils.getBookingDuration(rental.slot.duration));
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Location-Value").html(Backend.getBookingConfiguration().locations[rental.location_id].name);
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Boat-Value").html(Backend.getBookingConfiguration().locations[rental.location_id].boats[rental.boat_id].name);
    
    $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Reservation-Value").html(rentalElement._reservationId);
    
    if (rental.status == Backend.RESERVATION_STATUS_BOOKED) {
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-Button").html("Complete it");
    } else if (rental.status == Backend.RESERVATION_STATUS_COMPLETED) {
      $("#AdminHome-Screen-AdminInfo-RentalInfo-Details-Status-Button").html("Un-complete it");
    }
  },
}