OwnerHome = {
  ownerAccount: null,
  rentalStat: null,
  
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
    
    this._showRentals();
    
    this._showStatistics();
  },
  
  _showRentals: function() {
    var optionsSelector = $("#OwnerHome-Screen-AccountInfo-BoatRentals-Rentals");
    optionsSelector.empty();
    

    
    var upcomingRentals = [];
    var completedRentals = [];
    for (var reservationId in this.rentalStat.rentals) {
      var rental = this.rentalStat.rentals[reservationId];
      
      var rentalInfo = ScreenUtils.getBookingDate(rental.slot.time) + ", " + ScreenUtils.getBookingDuration(rental.slot.duration);
      var rentalOption = $("<div class=\"optionbox-option\">" + rentalInfo + "</div>");
      
      rentalOption[0]._rental = rental;
      rentalOption[0]._reservationId = reservationId;

      rentalOption.click(function(event) {
        $(".optionbox-option").removeClass("selected");
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
    
    
    if ($(".optionbox-option").length > 0) {
      $(".optionbox-option")[0].click();
    }

    if (upcomingRentalsGroup.children().length == 1) {
      $("<div class=\"optionbox-nooption\">None</div>").appendTo(upcomingRentalsGroup);
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
    $("#OwnerHome-Screen-AccountInfo-RentalInfo-Details-Income-Value").html(ScreenUtils.getBookingPrice(rental.slot.price));
  },
  
  
  
  _showStatistics: function() {
    var numberOfRentals = 0;
    var earnedMoney = 0;
    
    for (var reservationId in this.rentalStat.rentals) {
      var rental = this.rentalStat.rentals[reservationId];
      
      if (rental.status == Backend.RESERVATION_STATUS_COMPLETED) {
        numberOfRentals++;
        earnedMoney += rental.slot.price;
      }
    }
    
    $("#OwnerHome-Screen-Statistics-NumberOfRentals-Value").html(numberOfRentals);
    $("#OwnerHome-Screen-Statistics-Earnings-Value").html(ScreenUtils.getBookingPrice(earnedMoney));
  }
}