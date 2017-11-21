BookingTime = {
  availableSlots: null,
  bookingSettings: null,

  _selectedDate: null,
  _selectedTime: null,
  _selectedDuration: null,
  
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();

    if (Backend.isPayedReservation() || reservationContext.location_id == null || reservationContext.boat_id == null) {
      Main.loadScreen("home");
      return;
    }
    
    if (reservationContext.slot == null) {
      this._selectedDate = this.bookingSettings.scheduling_begin_date;
      this._selectedTime = null;
      this._selectedDuration = null;
    } else {
      this._selectedDate = ScreenUtils.getDateForTime(reservationContext.slot.time).getTime();
      this._selectedTime = reservationContext.slot.time;
      this._selectedDuration = reservationContext.slot.duration;
    }
    
    
    $("#BookingTime-Screen-SelectionPanel-Calendar").datepicker({
      beforeShowDay: function(date) {
        var isSelectable = BookingTime.availableSlots[ScreenUtils.getUTCMillis(date)] > 0;

        return [isSelectable, "", null];
      },
      
      onSelect: function(dateText, instance) {
        var newSelectedDate = ScreenUtils.getUTCMillis(new Date(dateText));
        
        if (newSelectedDate == this._selectedDate) {
          return;
        }
        
        this._selectedDate = newSelectedDate;
        reservationContext.slot = null;
        
        this._canProceedToNextStep();
        
        this._showTimes();
      }.bind(this),
      
      defaultDate: ScreenUtils.getLocalTime(this._selectedDate),
      minDate: ScreenUtils.getLocalTime(this.bookingSettings.scheduling_begin_date),
      maxDate: ScreenUtils.getLocalTime(this.bookingSettings.scheduling_end_date)
    });

    
    $("#BookingTime-Screen-Description-BackButton").click(function() {
      Main.loadScreen("booking_boat");
    });
    
    $("#BookingTime-Screen-Description-NextButton").click(function() {
      Main.loadScreen("booking_location");
    });
    
    this._canProceedToNextStep();
    
    this._showTimes();
  },
  
  _showTimes: function() {
    $("#BookingTime-Screen-SelectionPanel-Duration-Durations").empty();
    $("#BookingTime-Screen-SelectionPanel-TimeFrame-Times").empty();
    
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

          var timeInterval = $("<div class=\"optionbox-option times\">" + ScreenUtils.getBookingTime(parseInt(time)) + " (" + ScreenUtils.getBookingDuration(maxDuration) + " max)</div>").appendTo($("#BookingTime-Screen-SelectionPanel-TimeFrame-Times"));

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
    $("#BookingTime-Screen-SelectionPanel-Duration-Durations").empty();
    
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      var durationElement = $("<div class=\"optionbox-option durations\">" + ScreenUtils.getBookingDuration(slot.duration) + " - " + ScreenUtils.getBookingPrice(slot.price) + "</div>").appendTo($("#BookingTime-Screen-SelectionPanel-Duration-Durations"));
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
    if (reservationContext.slot != null) {
      $("#BookingTime-Screen-Description-NextButton").prop("disabled", false);
      
      $("#BookingTime-Screen-ReservationSummary").html(ScreenUtils.getBookingSummary(reservationContext));
    } else {
      $("#BookingTime-Screen-Description-NextButton").prop("disabled", true);
      $("#BookingTime-Screen-ReservationSummary").html("Select date, time, and ride duration.");
    }
  },
}