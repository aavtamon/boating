BookingLocation = {
  onLoad: function() {
    this._showLocationMap();
    this._canProceedToNextStep();
  },
    
  
  initMap: function() {
    var centerLocation = Backend.getCenterLocation();
    var map = new google.maps.Map(document.getElementById("BookingLocation-Screen-SelectionPanel-LocationMap"), {
      zoom: centerLocation.zoom,
      center: centerLocation
    });
    
//    map.addListener('center_changed', function() {
//      setTimeout(function() {
//        map.panTo(centerLocation);
//      }, 3000);
//    });    
    
    var locations = Backend.getLocations();
    for (var i in locations) {
      var location = locations[i];

      var marker = new google.maps.Marker({
        position: location,
        map: map,
        label: location.name,
        icon: "imgs/boat.png",
        animation: google.maps.Animation.DROP,
        _location: location
      });
      
      marker.addListener('click', function(marker) {
        Backend.getReservationContext().location = marker._location;
        this._canProceedToNextStep();
      }.bind(this, marker));
    }
  },
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date != null && reservationContext.interval != null && reservationContext.duration != null && reservationContext.location != null) {
      $("#BookingLocation-Screen-ButtonsPanel-NextButton").removeAttr("disabled");
      
      var tripDate = reservationContext.date.getMonth() + "/" + reservationContext.date.getDate() + "/" + reservationContext.date.getFullYear();
      var tripTime = reservationContext.interval.time.getHours() + " " + (reservationContext.interval.time.getHours() >= 12 ? 'pm' : 'am');
      var tripDuration = reservationContext.duration + (reservationContext.duration == 1 ? " hour" : " hours");
      var summaryInfo = "You selected " + tripDate + ", " + tripTime + " for " + tripDuration
                        + ", pick up at " + reservationContext.location.name;
      
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