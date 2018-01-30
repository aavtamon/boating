BookingLocation = {
  centerLocation: null,
  _mapHolder: null,
  
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (Backend.isPayedReservation() || reservationContext.slot == null) {
      Main.loadScreen("home");
      return;
    }
    
    $("#BookingLocation-Screen-Description-BackButton").click(function() {
      Main.loadScreen("booking_time");
    });

    $("#BookingLocation-Screen-Description-NextButton").click(function() {
      Main.loadScreen("booking_renters");
    });
    
    
    this._initMap();
    
    this._canProceedToNextStep();
  },
    
  
  _initMap: function() {
    var mapElement = document.getElementById("BookingLocation-Screen-SelectionPanel-LocationMap");
    if (mapElement == null) {
      return;
    }
    
    var rentalLocation = Backend.getBookingConfiguration().locations[Backend.getReservationContext().location_id];
    var centerLocation = rentalLocation.center_location;
    
    this._mapHolder = Main.recoverElement("MapHolder");
    if (this._mapHolder == null) {
      this._mapHolder = document.createElement("div");
      this._mapHolder.style.width = "100%";
      this._mapHolder.style.height = "100%";
      
      this._mapHolder._map = new google.maps.Map(this._mapHolder, {
        zoom: centerLocation.zoom,
        center: centerLocation
      });
      
      google.maps.event.addListenerOnce(this._mapHolder._map, 'idle', function() {
        google.maps.event.trigger(this._mapHolder._map, 'resize');
      }.bind(this));

      
      
      this._mapHolder._markers = [];
      for (var locationId in rentalLocation.pickup_locations) {
        var location = rentalLocation.pickup_locations[locationId];

        var marker = new google.maps.Marker({
          position: location.location,
          map: this._mapHolder._map,
          label: location.name,
  //        icon: "imgs/boat.png",
          _locationId: locationId
        });

        marker.addListener('click', function(marker) {
          Backend.getReservationContext().pickup_location_id = marker._locationId;
          this._canProceedToNextStep();

          for (var i in this._mapHolder._markers) {
            if (this._mapHolder._markers[i] != marker) {
              this._mapHolder._markers[i].setAnimation(null);
            }
          }
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }.bind(this, marker));

        if (Backend.getReservationContext().pickup_location_id == locationId) {
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }

        this._mapHolder._markers.push(marker);
      }
    }
    
    Main.storeElement("MapHolder", this._mapHolder);
    for (var i in this._mapHolder._markers) {
      var marker = this._mapHolder._markers[i];
      if (Backend.getReservationContext().pickup_location_id != marker._locationId) {
        marker.setAnimation(null);
      } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }
    }
    
    mapElement.appendChild(this._mapHolder);
    
    
        
    $("#BookingLocation-Screen-SelectionPanel-CenterButton").click(function() {
      this._mapHolder._map.panTo(centerLocation);
      this._mapHolder._map.setZoom(centerLocation.zoom);
    }.bind(this));
    
//    map.addListener('center_changed', function() {
//      $("#BookingLocation-Screen-SelectionPanel-CenterButton").removeClass(disabled);
//    });    
  },
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
  
    if (reservationContext.pickup_location_id != null) {
      $("#BookingLocation-Screen-Description-NextButton").prop("disabled", false);
      
      $("#BookingLocation-Screen-ReservationSummary").html(ScreenUtils.getBookingSummary(reservationContext));
    } else {
      $("#BookingLocation-Screen-Description-NextButton").prop("disabled", true);
      $("#BookingLocation-Screen-ReservationSummary").html("Select one of the marked locations.<br>We will bring the boat to the place of your choice.");
    }
  },
}