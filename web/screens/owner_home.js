OwnerHome = {
  currentDate: null,
  ownerAccount: null,
  rentalStat: null,
  bookingSummaries: null,
  
  onLoad: function() {
    if (this.ownerAccount == null) {
      Main.loadScreen("owner_login");
      return;
    }
    
    
    $("#OwnerHome-Screen-Description-LogoutButton").click(function() {
      Backend.logOut(function() {
        Main.loadScreen("owner_login");
      });
    });
    
    $("#OwnerHome-Screen-AccountInfo-OwnerReservations-Actions-BookButton").click(function() {
      Main.loadScreen("owner_booking");
    });    
    
    
    this._showBookings();
    this._showRentals();
    
    this._showStatistics();
  },
  
  _showRentals: function() {
    var optionsSelector = $("#OwnerHome-Screen-AccountInfo-BoatRentals-Rentals");
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

        this._showSlotDetails(event.target);
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
        console.error("Unexpected status " + rental.status + " of reservation " + reservationId);
      }
    }
    
    sortingRule = function(option1, option2) {
      return option1._rental.slot.time - option2._rental.slot.time;
    };
    upcomingRentals.sort(sortingRule);
    inprocessRentals.sort(sortingRule);
    accidentRentals.sort(sortingRule);
    completedRentals.sort(sortingRule);

    
    var upcomingRentalsGroup = $("<div class=\"optionbox-optiongroup\"><div class=\"optionbox-optiongroup-title\">Upcoming rentals</div></div>").appendTo(optionsSelector);
    var inprocessRentalsGroup = $("<div class=\"optionbox-optiongroup\"><div class=\"optionbox-optiongroup-title\">In-process rentals</div></div>").appendTo(optionsSelector);
    if (accidentRentals.length > 0) {
      var accidentRentalsGroup = $("<div class=\"optionbox-optiongroup\"><div class=\"optionbox-optiongroup-title\">Accident rentals</div></div>").appendTo(optionsSelector);
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
  
  
  _showSlotDetails: function(rentalElement) {
    var rental = rentalElement._rental;
    
    $("#OwnerHome-Screen-AccountInfo-RentalInfo-Details-Date-Value").html(ScreenUtils.getBookingDate(rental.slot.time));
    $("#OwnerHome-Screen-AccountInfo-RentalInfo-Details-Time-Value").html(ScreenUtils.getBookingTime(rental.slot.time));
    $("#OwnerHome-Screen-AccountInfo-RentalInfo-Details-Duration-Value").html(ScreenUtils.getBookingDuration(rental.slot.duration));
    $("#OwnerHome-Screen-AccountInfo-RentalInfo-Details-Location-Value").html(Backend.getBookingConfiguration().locations[rental.location_id].name);
    $("#OwnerHome-Screen-AccountInfo-RentalInfo-Details-Boat-Value").html(Backend.getBookingConfiguration().locations[rental.location_id].boats[rental.boat_id].name);
    
    $("#OwnerHome-Screen-AccountInfo-RentalInfo-Details-Reservation-Value").html(rentalElement._reservationId);
    $("#OwnerHome-Screen-AccountInfo-RentalInfo-Details-Income-Value").html(ScreenUtils.getBookingPrice(rental.payment_amount));
  },
  
  
  _showBookings: function() {
    var bookingGroup = $("#OwnerHome-Screen-AccountInfo-OwnerReservations-Bookings");
    
    sortingRule = function(summary1, summary2) {
      return summary1.slot.time - summary2.slot.time;
    };
    this.bookingSummaries.sort(sortingRule);
    
    for (var i in this.bookingSummaries) {
      var bookingSummary = this.bookingSummaries[i];
      
      var summaryOption = $("<div class=\"optionbox-option bookings\">" + ScreenUtils.getBookingDate(bookingSummary.slot.time) + " " + ScreenUtils.getBookingTime(bookingSummary.slot.time) + "</div>");
      summaryOption[0]._summary = bookingSummary;
      
      summaryOption.appendTo(bookingGroup);
      
      summaryOption.click(function(event) {
        $(".bookings").removeClass("selected");
        $(event.target).addClass("selected");
        
        Backend.restoreReservationContext(event.target._summary.id, null, function() {
          Main.loadScreen("owner_reservation_update?id=" + event.target._summary.id);
        });
      });
    }
  },
  
  _showStatistics: function() {
    var numberOfRentals = 0;
    var earnedMoney = 0;
    
    var curDate = ScreenUtils.getDateForTime(this.currentTime);
    curDate.setUTCDate(1);
    var beginningOfMonthMillis = curDate.getTime();
    
    for (var reservationId in this.rentalStat.rentals) {
      var rental = this.rentalStat.rentals[reservationId];
      
      if (rental.status == Backend.RESERVATION_STATUS_COMPLETED
         && rental.slot.time > beginningOfMonthMillis) {

        numberOfRentals++;
        earnedMoney += rental.payment_amount;
      }
    }
    
    $("#OwnerHome-Screen-Statistics-NumberOfRentals-Value").html(numberOfRentals);
    $("#OwnerHome-Screen-Statistics-Earnings-Value").html(ScreenUtils.getBookingPrice(earnedMoney));
  }
}