Booking = {
  onLoad: function() {
    Backend.resetReservationContext();
    this._canProceedToNextStep();
    
    
    $("#Booking-Screen-SelectionPanel-Calendar").datepicker({
      beforeShowDay: function(date) {
        var isSelectable = Backend.getAvailableTimes(date).length > 0;
        
        return [isSelectable, "", null];
      },
      
      onSelect: function(dateText, instance) {
        var newSelectedDate = new Date(dateText);
        if (Backend.getReservationContext().date != null && newSelectedDate.getTime() == Backend.getReservationContext().date.getTime()) {
          return;
        }
        Backend.getReservationContext().date = newSelectedDate;
        this._canProceedToNextStep();
        
        this._showTimes();
        
        $("#Booking-Screen-SelectionPanel-Calendar").animate({ 
            marginLeft: "50px",
        }, 1000, function() {
          $("#Booking-Screen-SelectionPanel-TimeFrame").animate({ 
            opacity: 1,
          }, 1000);
        });
      }.bind(this),
      
      defaultDate: Backend.getCurrentDate(),
      minDate: Backend.getSchedulingBeginDate(),
      maxDate: Backend.getSchedulingEndDate()
    })
  },
    
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date != null && reservationContext.interval != null && reservationContext.duration != null) {
      $("#Booking-Screen-ButtonsPanel-NextButton").removeAttr("disabled");
      
      var locationDetails = Backend.getLocationInfo(reservationContext.location);
      
      var tripDate = reservationContext.date.getMonth() + "/" + reservationContext.date.getDate() + "/" + reservationContext.date.getFullYear();
      var tripTime = reservationContext.interval.time.getHours() + " " + (reservationContext.interval.time.getHours() >= 12 ? 'pm' : 'am');
      var tripDuration = reservationContext.duration + (reservationContext.duration == 1 ? " hour" : " hours");
      var summaryInfo = "You selected " + tripDate + ", " + tripTime + " for " + tripDuration + ".";
      
      $("#Booking-Screen-ButtonsPanel-Summary").text(summaryInfo);
    } else {
      $("#Booking-Screen-ButtonsPanel-NextButton").attr("disabled", true);
      $("#Booking-Screen-ButtonsPanel-Summary").text("");
    }
  },

  _showTimes: function() {
    $("#Booking-Screen-SelectionPanel-Duration").css("opacity", 0);
    $("#Booking-Screen-SelectionPanel-TimeFrame-Times").empty();
    Backend.getReservationContext().interval = null;
    this._canProceedToNextStep();
   
    $("#Booking-Screen-SelectionPanel-TimeFrame").animate({ 
      marginLeft: "150px",
    }, 1000);
   
    
    var intervals = Backend.getAvailableTimes(Backend.getReservationContext().date);
    for (var i in intervals) {
      var interval = intervals[i];
      
      var hours = interval.time.getHours();
      var minutes = interval.time.getMinutes();
      var ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      
      var duration = interval.maxDuration + (interval.maxDuration > 1 ? " hours" : " hour");
      
      var timeInterval = $("<div class=\"booking-time-interval\">" + hours + ampm + " (" + duration + ")</div>").appendTo($("#Booking-Screen-SelectionPanel-TimeFrame-Times"));
      timeInterval.click(function(interval) {
        Backend.getReservationContext().interval = interval;
        this._canProceedToNextStep();
        
        this._showDurations();
        $("#Booking-Screen-SelectionPanel-TimeFrame").animate({ 
          marginLeft: "50px",
        }, 1000);
      }.bind(this, interval));
    }
  },
      
  _showDurations: function() {
    $("#Booking-Screen-SelectionPanel-Duration-Durations").empty();
    Backend.getReservationContext().duration = null;
    this._canProceedToNextStep();

    $("#Booking-Screen-SelectionPanel-Duration").animate({ 
      opacity: 1,
    }, 1000, function() {
      if (Backend.getReservationContext().interval.minDuration == Backend.getReservationContext().interval.maxDuration) {
        Backend.getReservationContext().duration = Backend.getReservationContext().interval.minDuration;
        this._canProceedToNextStep();
      }
    }.bind(this));
    
    for (var i = Backend.getReservationContext().interval.minDuration; i <= Backend.getReservationContext().interval.maxDuration; i++) {
      var duration = $("<div class=\"booking-duration\">" + i + "</div>").appendTo($("#Booking-Screen-SelectionPanel-Duration-Durations"));
      duration.click(function(duration) {
        Backend.getReservationContext().duration = i;
        this._canProceedToNextStep();
      }.bind(this, i));
    }
  }
      
      
//      function showLocationMap() {
//        $("#Booking-Screen-SelectionPanel-LocationMap").animate({ 
//          marginTop: "-150px",
//          opacity: 1
//        }, 1000);
//        
//        $(".booking-map-location").click(function(event) {
//          var locationId = $(event.target).attr("location-id");
//          Backend.getReservationContext().location = locationId;
//          
//          $(".booking-map-location").removeClass("selected");
//          $(event.target).addClass("selected");
//          
//          canProceedToNextStep();
//        });
//      }
    
}