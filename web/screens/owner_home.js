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
    
    for (var reservationId in this.rentalStat.rentals) {
      var rental = this.rentalStat.rentals[reservationId];
      
      var rentalInfo = ScreenUtils.getBookingDate(rental.slot.time) + ", " + ScreenUtils.getBookingDuration(rental.slot.duration);
      
      var rentalOption = $("<div class=\"optionbox-option\">" + rentalInfo + "</div>").appendTo(optionsSelector);
      rentalOption[0]._rental = rental;
      rentalOption[0]._reservationId = reservationId;

      rentalOption.click(function(event) {
        $(".optionbox-option").removeClass("selected");
        $(event.target).addClass("selected");

        this._showSlotDetails(event.target);
      }.bind(this));
    }

    if ($(".optionbox-option").length > 0) {
      $(".optionbox-option")[0].click();
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
      numberOfRentals++;
      
      var rental = this.rentalStat.rentals[reservationId];
      earnedMoney += rental.slot.price;
    }
    
    $("#OwnerHome-Screen-Statistics-NumberOfRentals-Value").html(numberOfRentals);
    $("#OwnerHome-Screen-Statistics-Earnings-Value").html(ScreenUtils.getBookingPrice(earnedMoney));
  }
}