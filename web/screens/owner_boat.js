OwnerBoat = {
  onLoad: function() {
    if (!Backend.isLogged()) {
      Main.loadScreen("owner_login");
      return;
    }
    
    
    $("#BookingBoat-Screen-Description-NextButton").click(function() {
      Main.loadScreen("booking_time");
    });
    
    $("#BookingBoat-Screen-SelectionPanel-BoatPictures-Title-PreviousButton").click(function() {
      this._showBoatPicture(--this._currentImageIndex);
    }.bind(this));
    $("#BookingBoat-Screen-SelectionPanel-BoatPictures-Title-NextButton").click(function() {
      this._showBoatPicture(++this._currentImageIndex);
    }.bind(this));

    
    this._canProceedToNextStep();
    
    this._showBoats();
  },
  
  _showBoats: function() {
    $("#BookingTime-Screen-SelectionPanel-Boats-Options").empty();
    
    var rentalLocation = Backend.getBookingConfiguration().locations[Backend.getReservationContext().location_id];
    
    for (var boatId in rentalLocation.boats) {
      var boat = rentalLocation.boats[boatId];
      
      var boatOption = $("<div class=\"optionbox-option\">" + boat.name + "</div>").appendTo($("#BookingBoat-Screen-SelectionPanel-Boats-Options"));

      boatOption[0]._boatId = boatId;

      boatOption.click(function(event) {
        $(".optionbox-option").removeClass("selected");
        $(event.target).addClass("selected");

        Backend.getReservationContext().boat_id = event.target._boatId;
        
        this._showBoatDetails();

        this._canProceedToNextStep();
      }.bind(this));
      
      if (boatId == Backend.getReservationContext().boat_id) {
        boatOption.click();
      }
    }
    
    var boatOptions = $(".optionbox-option");
    if (boatOptions.length == 1 && Backend.getReservationContext().boat_id == null) {
      boatOptions.click();
    }
  },
  
  
  _showBoatDetails: function() {
    var reservationContext = Backend.getReservationContext();
    var boat = Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id];
    
    $("#BookingBoat-Screen-SelectionPanel-BoatDescription-Details-Name-Value").html(boat.name);
    $("#BookingBoat-Screen-SelectionPanel-BoatDescription-Details-Type-Value").html(boat.type);
    $("#BookingBoat-Screen-SelectionPanel-BoatDescription-Details-Capacity-Value").html(boat.maximum_capacity + " people");
    $("#BookingBoat-Screen-SelectionPanel-BoatDescription-Details-Engine-Value").html(boat.engine);
    $("#BookingBoat-Screen-SelectionPanel-BoatDescription-Details-Mileage-Value").html(boat.mileage + " mpg");

    this._showBoatPicture(this._currentImageIndex);
  },
  
  _showBoatPicture: function(imageIndex) {
    var reservationContext = Backend.getReservationContext();
    var boat = Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id];

    if (imageIndex >= 0 && imageIndex < boat.images.length) {
      var imgResource = boat.images[imageIndex];
      $("#BookingBoat-Screen-SelectionPanel-BoatPictures-Picture").attr("src", imgResource.url);
      $("#BookingBoat-Screen-SelectionPanel-BoatPictures-Note").html(imgResource.description);
    }
    
    $("#BookingBoat-Screen-SelectionPanel-BoatPictures-Title-PreviousButton").prop("disabled", imageIndex == 0);
    $("#BookingBoat-Screen-SelectionPanel-BoatPictures-Title-NextButton").prop("disabled", imageIndex >= boat.images.length - 1);
  },
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.boat_id != null) {
      $("#BookingBoat-Screen-Description-NextButton").prop("disabled", false);
      
      $("#BookingBoat-Screen-ReservationSummary").html("You selected " + Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id].name);
    } else {
      $("#BookingBoat-Screen-Description-NextButton").prop("disabled", true);
      $("#BookingBoat-Screen-ReservationSummary").html("Select a boat for your ride");
    }
  },
}