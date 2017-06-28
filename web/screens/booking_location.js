BookingLocation = {
  onLoad: function() {
    this._showLocationMap();
    this._canProceedToNextStep();
  },
    
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date != null && reservationContext.interval != null && reservationContext.duration != null && reservationContext.location != null) {
      $("#BookingLocation-Screen-ButtonsPanel-NextButton").removeAttr("disabled");
      
      var locationDetails = Backend.getLocationInfo(reservationContext.location);
      
      var tripDate = reservationContext.date.getMonth() + "/" + reservationContext.date.getDate() + "/" + reservationContext.date.getFullYear();
      var tripTime = reservationContext.interval.time.getHours() + " " + (reservationContext.interval.time.getHours() >= 12 ? 'pm' : 'am');
      var tripDuration = reservationContext.duration + (reservationContext.duration == 1 ? " hour" : " hours");
      var summaryInfo = "You selected " + tripDate + ", " + tripTime + " for " + tripDuration
                        + ", pick up at " + locationDetails.name;
      
      $("#BookingLocation-Screen-ButtonsPanel-Summary").text(summaryInfo);
    } else {
      $("#BookingLocation-Screen-ButtonsPanel-NextButton").attr("disabled", true);
      $("#BookingLocation-Screen-ButtonsPanel-Summary").text("");
    }
  },

      
  _showLocationMap: function() {
    $(".booking-map-location").click(function(event) {
      var locationId = $(event.target).attr("location-id");
      Backend.getReservationContext().location = locationId;
      
      $(".booking-map-location").removeClass("selected");
      $(event.target).addClass("selected");
      
      canProceedToNextStep();
    });
  }
    
}