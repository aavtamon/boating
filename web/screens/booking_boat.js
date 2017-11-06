BookingBoat = {
  
  onLoad: function() {
    if (Backend.isPayedReservation()) {
      Backend.resetReservationContext();
    }
    //TODO: replace with proper location selection
    Backend.getReservationContext().location_id = "lanier";
    
    
    $("#BookingBoat-Screen-Description-NextButton").click(function() {
      Main.loadScreen("booking_time");
    });
    
    this._canProceedToNextStep();
    
    this._showBoats();
  },
  
  _showBoats: function() {
    $("#BookingTime-Screen-SelectionPanel-Boats-Options").empty();
    
    var rentalLocation = Backend.getBookingConfiguration().locations[Backend.getReservationContext().location_id];
    
    for (var boatId in rentalLocation.boats) {
      var boat = rentalLocation.boats[boatId];
      
      var boatOption = $("<div class=\"bookingboat-option\">" + boat.name + "</div>").appendTo($("#BookingBoat-Screen-SelectionPanel-Boats-Options"));

      boatOption[0]._boatId = boatId;

      boatOption.click(function(event) {
        $(".bookingboat-option").removeClass("selected");
        $(event.target).addClass("selected");

        Backend.getReservationContext().boatId = event.target._boatId;
        
        this._showBoatDetails();

        this._canProceedToNextStep();
      }.bind(this));
      
      if (boatId == Backend.getReservationContext().boatId) {
        boatOption.click();
      }
    }
    
    var boatOptions = $(".bookingboat-option");
    if (boatOptions.length == 1 && Backend.getReservationContext().boatId == null) {
      boatOptions.click();
    }
  },
  
  
  _showBoatDetails: function() {
    var reservationContext = Backend.getReservationContext();
    var boat = Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boatId];
    
    $("#BookingBoat-Screen-SelectionPanel-BoatDescription-Details-Name-Value").html(boat.name);
    $("#BookingBoat-Screen-SelectionPanel-BoatDescription-Details-Type-Value").html(boat.type);
    $("#BookingBoat-Screen-SelectionPanel-BoatDescription-Details-Capacity-Value").html(boat.maximum_capacity + " people");
    $("#BookingBoat-Screen-SelectionPanel-BoatDescription-Details-Engine-Value").html(boat.engine);
  },
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.boatId != null) {
      $("#BookingBoat-Screen-Description-NextButton").prop("disabled", false);
      
      $("#BookingBoat-Screen-ReservationSummary").html("You selected " + Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boatId].name);
    } else {
      $("#BookingBoat-Screen-Description-NextButton").prop("disabled", true);
      $("#BookingBoat-Screen-ReservationSummary").html("Select a boat for your ride");
    }
  },
}