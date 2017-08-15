BookingLocation = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date == null || reservationContext.duration == null) {
      Main.loadScreen("home");
    }
    
    $("#BookingLocation-Screen-ButtonsPanel-BackButton").click(function() {
      Main.loadScreen("booking_time");
    });

    $("#BookingLocation-Screen-ButtonsPanel-NextButton").click(function() {
      Backend.saveReservationContext(function(status) {
        Main.loadScreen("booking_confirmation");
      });
    });
    
    this._canProceedToNextStep();
  },
    
  
  initMap: function() {
    var centerLocation = Backend.getCenterLocation();
    var map = new google.maps.Map(document.getElementById("BookingLocation-Screen-SelectionPanel-LocationMap"), {
      zoom: centerLocation.zoom,
      center: centerLocation
    });
    
    
    $("#BookingLocation-Screen-SelectionPanel-CenterButton").click(function() {
      map.panTo(centerLocation);
      map.setZoom(centerLocation.zoom);
    });
    
//    map.addListener('center_changed', function() {
//      $("#BookingLocation-Screen-SelectionPanel-CenterButton").removeClass(disabled);
//    });    
    
    this._markers = [];
    
    var locations = Backend.getLocations();
    for (var i in locations) {
      var location = locations[i];

      var marker = new google.maps.Marker({
        position: location,
        map: map,
        label: location.name,
//        icon: "imgs/boat.png",
        _location: location
      });
      
      marker.addListener('click', function(marker) {
        Backend.getReservationContext().location_id = marker._location.id;
        this._canProceedToNextStep();
        
        for (var i in this._markers) {
          if (this._markers[i] != marker) {
            this._markers[i].setAnimation(null);
          }
        }
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }.bind(this, marker));
      
      if (Backend.getReservationContext().location_id == location.id) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }
      
      this._markers.push(marker);
    }
  },
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date != null && reservationContext.duration != null && reservationContext.location_id != null) {
      $("#BookingLocation-Screen-ButtonsPanel-NextButton").removeAttr("disabled");
      
      $("#BookingLocation-Screen-ButtonsPanel-Summary").html(ScreenUtils.getBookingSummary(reservationContext));
    } else {
      $("#BookingLocation-Screen-ButtonsPanel-NextButton").attr("disabled", true);
      $("#BookingLocation-Screen-ButtonsPanel-Summary").text("");
    }
  },
}