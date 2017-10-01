BookingTime = {
  availableSlots: {},
  currentDate: null,
  schedulingBeginDate: null,
  schedulingEndDate: null,
  
  selectedDate: null,
  
  onLoad: function() {
    if (Backend.getReservationContext().slot == null) {
      this.selectedDate = BookingTime.schedulingBeginDate;
    } else {
      this.selectedDate = new Date(Backend.getReservationContext().slot.time);
    }
    
    $("#BookingTime-Screen-SelectionPanel-Calendar").datepicker({
      beforeShowDay: function(date) {
        var isSelectable = BookingTime.availableSlots[date.getTime()] > 0;

        return [isSelectable, "", null];
      },
      
      onSelect: function(dateText, instance) {
        var newSelectedDate = new Date(dateText);
        
        var reservationDate = new Date(this.selectedDate);
        reservationDate.setHours(0);
        reservationDate.setMinutes(0);
        if (newSelectedDate.getTime() == reservationDate.getTime()) {
          return;
        }
        this.selectedDate = newSelectedDate;
        
        this._canProceedToNextStep();
        
        this._showTimes();
      }.bind(this),
      
      defaultDate: this.selectedDate,
      minDate: BookingTime.schedulingBeginDate,
      maxDate: BookingTime.schedulingEndDate
    });
    
    
    $("#BookingTime-Screen-ButtonsPanel-NextButton").click(function() {
      Backend.saveReservationContext(function(status) {
        Main.loadScreen("booking_location");
      });
    });
    
    this._canProceedToNextStep();
    
    this._showTimes();
  },
  
  _showTimes: function() {
    $("#BookingTime-Screen-SelectionPanel-Duration-Durations").empty();
    $("#BookingTime-Screen-SelectionPanel-TimeFrame-Times").empty();
    
    var intervals = Backend.getAvailableSlots(this.selectedDate, function(status, slots) {
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

          var timeInterval = $("<div class=\"bookingtime-time-interval\">" + ScreenUtils.getBookingTime(parseInt(time)) + " (" + ScreenUtils.getBookingDuration(maxDuration) + " max)</div>").appendTo($("#BookingTime-Screen-SelectionPanel-TimeFrame-Times"));

          timeInterval[0]._time = time;


          timeInterval.click(function(event) {
            $(".bookingtime-time-interval").removeClass("selected");
            $(event.target).addClass("selected");

            Backend.getReservationContext().slot = null;

            this._canProceedToNextStep();

            this._showDurations(times[event.target._time]);
          }.bind(this));
        }
        

        var timeIntervals = $(".bookingtime-time-interval");
        if (timeIntervals.length == 1) {
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
      var durationElement = $("<div class=\"bookingtime-duration\">" + ScreenUtils.getBookingDuration(slot.duration) + "</div>").appendTo($("#BookingTime-Screen-SelectionPanel-Duration-Durations"));
      durationElement[0]._slot = slot;
      
      durationElement.click(function(event) {
        $(".bookingtime-duration").removeClass("selected");
        $(event.target).addClass("selected");
        
        Backend.getReservationContext().slot = event.target._slot;
        this._canProceedToNextStep();
      }.bind(this));
    }
    
    if (slots.length == 1) {
      $(".bookingtime-duration").addClass("selected");
      Backend.getReservationContext().slot = slots[0];

      this._canProceedToNextStep();
    }
  },
  
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.slot != null) {
      $("#BookingTime-Screen-ButtonsPanel-NextButton").removeAttr("disabled");
      
      $("#BookingTime-Screen-ButtonsPanel-Summary").html(ScreenUtils.getBookingSummary(reservationContext));
    } else {
      $("#BookingTime-Screen-ButtonsPanel-NextButton").attr("disabled", true);
      $("#BookingTime-Screen-ButtonsPanel-Summary").text("");
    }
  },
}