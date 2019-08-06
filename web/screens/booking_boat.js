BookingBoat = {
  _currentImageIndex: 0,
  
  onLoad: function() {
    if (Backend.isPayedReservation() || Backend.getReservationContext().owner_account_id != "") {
      Backend.resetReservationContext();
    }

    //TODO: replace with proper location selection
    Backend.getReservationContext().location_id = "lanier";
    
    
    $("#BookingBoat-Screen-Description-NextButton").click(function() {
      Main.loadScreen("booking_time");
    });
    
    $("#BookingBoat-Screen-SelectionPanel-BoatPictures-Title-PreviousButton").click(function() {
      this._showBoatPicture(--this._currentImageIndex);
    }.bind(this));
    $("#BookingBoat-Screen-SelectionPanel-BoatPictures-Title-NextButton").click(function() {
      this._showBoatPicture(++this._currentImageIndex);
    }.bind(this));
    $("#BookingBoat-Screen-SelectionPanel-BoatPictures-Picture").click(function() {
      this._loadPreview();
    }.bind(this));
      

    
    this._canProceedToNextStep();
    
    this._showBoats();
  },
  
  _showBoats: function() {
    $("#BookingTime-Screen-SelectionPanel-Boats-Options").empty();
    
    var rentalLocation = Backend.getBookingConfiguration().locations[Backend.getReservationContext().location_id];
    
    for (var boatId in rentalLocation.boats) {
      var boat = rentalLocation.boats[boatId];
      
      var boatOption = $("<div class=\"optionbox-option boats\">" + boat.name + "</div>").appendTo($("#BookingBoat-Screen-SelectionPanel-Boats-Options"));

      boatOption[0]._boatId = boatId;

      boatOption.click(function(event) {
        $(".boats").removeClass("selected");
        $(event.target).addClass("selected");

        Backend.getReservationContext().boat_id = event.target._boatId;
        
        this._showBoatDetails();

        this._canProceedToNextStep();
      }.bind(this));
      
      if (boatId == Backend.getReservationContext().boat_id) {
        boatOption.click();
      }
    }
    
    var boatOptions = $(".boats");
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
  
  _loadPreview: function() {
    var reservationContext = Backend.getReservationContext();
    var boat = Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id];
    var imgResource = boat.images[this._currentImageIndex];
    
    Main.showMessage(imgResource.name, '<div id="BookingBoat-Screen-SelectionPanel-BoatPictures-Preview"><div id="BookingBoat-Screen-SelectionPanel-BoatPictures-Preview-Image" style="background-image: url(' + imgResource.url + ');"></div><div id="BookingBoat-Screen-SelectionPanel-BoatPictures-Preview-Description">' + imgResource.description + '</div></div>', null, Main.DIALOG_TYPE_INFORMATION);
  },
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.boat_id != null) {
      $("#BookingBoat-Screen-Description-NextButton").prop("disabled", false);
      
      $("#BookingBoat-Screen-ReservationSummary").html("You selected <b>" + Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id].name) + "</b>";
    } else {
      $("#BookingBoat-Screen-Description-NextButton").prop("disabled", true);
      $("#BookingBoat-Screen-ReservationSummary").html("Select a boat for your ride");
    }
  },
}