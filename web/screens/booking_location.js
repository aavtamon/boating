BookingLocation = {
  centerLocation: null,
  _mapHolder: null,
  
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (Backend.isPayedReservation() || reservationContext.slot == null) {
      Main.loadScreen("home");
      return;
    }
    
    $("#BookingLocation-Screen-ButtonsPanel-BackButton").click(function() {
      Main.loadScreen("booking_time");
    });

    $("#BookingLocation-Screen-ButtonsPanel-NextButton").click(function() {
      Main.loadScreen("booking_confirmation");
    });
    
    this._initMap();
    
    this._canProceedToNextStep();
  },
    
  
  _initMap: function() {
    var mapElement = document.getElementById("BookingLocation-Screen-SelectionPanel-LocationMap");
    if (mapElement == null) {
      return;
    }
    
    this._mapHolder = Main.recoverElement("MapHolder");
    if (this._mapHolder == null) {
      this._mapHolder = document.createElement("div");
      this._mapHolder.style.width = "100%";
      this._mapHolder.style.height = "100%";
      
      this._mapHolder._map = new google.maps.Map(this._mapHolder, {
        zoom: BookingLocation.centerLocation.zoom,
        center: BookingLocation.centerLocation
      });
      
      Main.storeElement("MapHolder", this._mapHolder);
      
      
      var markers = [];
      for (var i in Backend.availableLocations) {
        var location = Backend.availableLocations[i];

        var marker = new google.maps.Marker({
          position: location,
          map: this._mapHolder._map,
          label: location.name,
  //        icon: "imgs/boat.png",
          _location: location
        });

        marker.addListener('click', function(marker) {
          Backend.getReservationContext().location_id = marker._location.id;
          this._canProceedToNextStep();

          for (var i in markers) {
            if (markers[i] != marker) {
              markers[i].setAnimation(null);
            }
          }
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }.bind(this, marker));

        if (Backend.getReservationContext().location_id == location.id) {
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }

        markers.push(marker);
      }
    }
    mapElement.appendChild(this._mapHolder);
    
    
        
    $("#BookingLocation-Screen-SelectionPanel-CenterButton").click(function() {
      this._mapHolder._map.panTo(BookingLocation.centerLocation);
      this._mapHolder._map.setZoom(BookingLocation.centerLocation.zoom);
    }.bind(this));
    
//    map.addListener('center_changed', function() {
//      $("#BookingLocation-Screen-SelectionPanel-CenterButton").removeClass(disabled);
//    });    
  },
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.location_id != null) {
      $("#BookingLocation-Screen-ButtonsPanel-NextButton").removeAttr("disabled");
      
      $("#BookingLocation-Screen-ButtonsPanel-Summary").html(ScreenUtils.getBookingSummary(reservationContext));
    } else {
      $("#BookingLocation-Screen-ButtonsPanel-NextButton").attr("disabled", true);
      $("#BookingLocation-Screen-ButtonsPanel-Summary").text("");
    }
  },
}