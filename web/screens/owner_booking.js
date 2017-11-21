OwnerBooking = {
  ownerAccount: null,
  bookingSettings: null,
  
  _selectedDate: null,
  
  onLoad: function() {
    if (this.ownerAccount == null) {
      Main.loadScreen("owner_login");
      return;
    }


    Backend.resetReservationContext();

    this._selectedDate = this.bookingSettings.scheduling_begin_date;
    this._selectedTime = null;
    this._selectedDuration = null;
    
    $("#OwnerBooking-Screen-SelectionPanel-Calendar").datepicker({
      onSelect: function(dateText, instance) {
        var newSelectedDate = ScreenUtils.getUTCMillis(new Date(dateText));
        
        if (newSelectedDate == this._selectedDate) {
          return;
        }
        
        this._selectedDate = newSelectedDate;
        Backend.getReservationContext().slot = null;
        
        this._canProceedToNextStep();
        
        this._showTimes();
      }.bind(this),
      
      defaultDate: ScreenUtils.getLocalTime(this._selectedDate),
      minDate: ScreenUtils.getLocalTime(this.bookingSettings.scheduling_begin_date),
      maxDate: ScreenUtils.getLocalTime(this.bookingSettings.scheduling_end_date)
    });
    
    
    $("#OwnerBooking-Screen-Description-BookButton").click(function() {
      Main.loadScreen("booking_time");
    });
    
    this._showBoats();
    this._showTimes();
    
    this._canProceedToNextStep();
  },
  

  _showBoats: function() {
    $("#OwnerBooking-Screen-SelectionPanel-Boats-Options").empty();
    
    for (var locationId in this.ownerAccount.locations) {
      var location = this.ownerAccount.locations[locationId];
      
      for (var index in location.boats) {
        var boatId = location.boats[index];
        
        var boat = Backend.getBookingConfiguration().locations[locationId].boats[boatId];
        
        var boatOption = $("<div class=\"optionbox-option boats\">" + boat.name + "</div>").appendTo($("#OwnerBooking-Screen-SelectionPanel-Boats-Options"));

        boatOption[0]._locationId = locationId;
        boatOption[0]._boatId = boatId;

        boatOption.click(function(event) {
          $(".boats").removeClass("selected");
          $(event.target).addClass("selected");

          Backend.getReservationContext().location_id = event.target._locationId;
          Backend.getReservationContext().boat_id = event.target._boatId;

          this._canProceedToNextStep();
        }.bind(this));

        if (boatId == Backend.getReservationContext().boat_id) {
          boatOption.click();
        }
      }
    }
    
    var boatOptions = $(".boats");
    if (boatOptions.length == 1 && Backend.getReservationContext().boat_id == null) {
      boatOptions.click();
    }
  },
  
  
  _showTimes: function() {
    $("#OwnerBooking-Screen-SelectionPanel-Duration-Durations").empty();
    $("#OwnerBooking-Screen-SelectionPanel-TimeFrame-Times").empty();
    
    var intervals = Backend.getAvailableSlots(this._selectedDate, function(status, slots) {
      if (status == Backend.STATUS_SUCCESS) {
        var times = {};
        
        for (var i in slots) {
          var slot = slots[i];
          
          if (times[slot.time] == null) {
            times[slot.time] = [slot];
          } else {
            times[slot.time].push(slot);
          }
        }
        
        for (var time in times) {
          var slots = times[time];
          var maxDuration = 0;
          for (var i in slots) {
            if (maxDuration < slots[i].duration) {
              maxDuration = slots[i].duration;
            }
          }

          var timeInterval = $("<div class=\"optionbox-option times\">" + ScreenUtils.getBookingTime(parseInt(time)) + " (" + ScreenUtils.getBookingDuration(maxDuration) + " max)</div>").appendTo($("#OwnerBooking-Screen-SelectionPanel-TimeFrame-Times"));

          timeInterval[0]._time = time;

          timeInterval.click(function(event) {
            $(".times").removeClass("selected");
            $(event.target).addClass("selected");

            Backend.getReservationContext().slot = null;
            this._selectedTime = event.target._time;

            this._canProceedToNextStep();

            this._showDurations(times[event.target._time]);
          }.bind(this));
          
          if (time == this._selectedTime) {
            timeInterval.click();
          }
        }
        
        var timeIntervals = $(".times");
        if (timeIntervals.length == 1 && this._selectedTime == null) {
          timeIntervals.addClass("selected");
          this._canProceedToNextStep();

          this._showDurations(times[timeIntervals[0]._time]);
        }
      }
    }.bind(this));
  },
      
  _showDurations: function(slots) {
    $("#OwnerBooking-Screen-SelectionPanel-Duration-Durations").empty();
    
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var durationElement = $("<div class=\"optionbox-option durations\">" + ScreenUtils.getBookingDuration(slot.duration) + " - " + ScreenUtils.getBookingPrice(slot.price) + "</div>").appendTo($("#OwnerBooking-Screen-SelectionPanel-Duration-Durations"));
      durationElement[0]._slot = slot;
      
      durationElement.click(function(event) {
        $(".durations").removeClass("selected");
        $(event.target).addClass("selected");
        
        this._selectedDuration = event.target._slot.duration;
        Backend.getReservationContext().slot = event.target._slot;

        this._canProceedToNextStep();
      }.bind(this));
      
      if (slot.duration == this._selectedDuration) {
        durationElement.click();
      }
    }
    
    if (slots.length == 1 && this._selectedDuration == null) {
      $(".durations").addClass("selected");
      Backend.getReservationContext().slot = slots[0];

      this._canProceedToNextStep();
    }
  },
  
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.location_id != null && reservationContext.boat_id != null && reservationContext.slot != null) {
      $("#OwnerBooking-Screen-Description-BookButton").prop("disabled", false);

      $("#OwnerBooking-Screen-ReservationSummary").html("You selected " + Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id].name + ", " + ScreenUtils.getBookingDate(reservationContext.slot.time) + " " + ScreenUtils.getBookingTime(reservationContext.slot.time) + ", " + ScreenUtils.getBookingDuration(reservationContext.slot.duration));
    } else {
      $("#OwnerBooking-Screen-Description-BookButton").prop("disabled", true);
      $("#OwnerBooking-Screen-ReservationSummary").html("Book your personal boat usage");
    }
  },
}