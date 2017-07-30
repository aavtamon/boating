BookingTime = {
  onLoad: function() {
    $("#BookingTime-Screen-SelectionPanel-Calendar").datepicker({
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
        Backend.getReservationContext().interval = null;
        
        this._canProceedToNextStep();
        
        this._showTimes();
      }.bind(this),
      
      defaultDate: Backend.getReservationContext().date != null ? Backend.getReservationContext().date : Backend.getCurrentDate(),
      minDate: Backend.getSchedulingBeginDate(),
      maxDate: Backend.getSchedulingEndDate()
    });
    
    
    $("#BookingTime-Screen-ButtonsPanel-NextButton").click(function() {
      Backend.saveReservationContext(function(status) {
        Main.loadScreen("booking_location");
      })
    });
    
    this._canProceedToNextStep();
    

    if (Backend.getReservationContext().date != null) {
      this._showTimes();
    }
  },
  
  _showTimes: function() {
    $("#BookingTime-Screen-SelectionPanel-Duration-Durations").empty();
    $("#BookingTime-Screen-SelectionPanel-TimeFrame-Times").empty();
   
    var intervals = Backend.getAvailableTimes(Backend.getReservationContext().date);
    for (var i in intervals) {
      var interval = intervals[i];
      
      var hours = interval.time.getHours();
      var minutes = interval.time.getMinutes();
      var ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      
      var duration = interval.maxDuration + (interval.maxDuration > 1 ? " hours" : " hour") + " max";
      
      var timeInterval = $("<div class=\"bookingtime-time-interval\">" + hours + ampm + " (" + duration + ")</div>").appendTo($("#BookingTime-Screen-SelectionPanel-TimeFrame-Times"));
      timeInterval.click(function(interval, event) {
        $(".bookingtime-time-interval").removeClass("selected");
        $(event.target).addClass("selected");
        
        Backend.getReservationContext().interval = interval;
        this._canProceedToNextStep();
        Backend.getReservationContext().duration = null;
        
        this._showDurations();
      }.bind(this, interval));
      
      
      if (intervals.length == 1
          || (Backend.getReservationContext().interval != null && Backend.getReservationContext().interval.id == interval.id)) {
        
        $(timeInterval).addClass("selected");
        Backend.getReservationContext().interval = interval;
        this._canProceedToNextStep();
        
        this._showDurations();
      }
    }
  },
      
  _showDurations: function() {
    $("#BookingTime-Screen-SelectionPanel-Duration-Durations").empty();
    
    for (var i = Backend.getReservationContext().interval.minDuration; i <= Backend.getReservationContext().interval.maxDuration; i++) {
      var tripLength = i + (i == 1 ? " hour" : " hours"); 
      var duration = $("<div class=\"bookingtime-duration\">" + tripLength + "</div>").appendTo($("#BookingTime-Screen-SelectionPanel-Duration-Durations"));
      duration.click(function(duration, event) {
        $(".bookingtime-duration").removeClass("selected");
        $(event.target).addClass("selected");
        
        Backend.getReservationContext().duration = duration;
        this._canProceedToNextStep();
      }.bind(this, i));
      
      
      if (Backend.getReservationContext().interval.minDuration == Backend.getReservationContext().interval.maxDuration
          || Backend.getReservationContext().duration == i) {
        
        $(duration).addClass("selected");
        Backend.getReservationContext().duration = Backend.getReservationContext().interval.minDuration;
        
        this._canProceedToNextStep();
      }
    }
  },
  
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date != null && reservationContext.interval != null && reservationContext.duration != null) {
      $("#BookingTime-Screen-ButtonsPanel-NextButton").removeAttr("disabled");
      
      $("#BookingTime-Screen-ButtonsPanel-Summary").html(ScreenUtils.getBookingSummary(reservationContext));
    } else {
      $("#BookingTime-Screen-ButtonsPanel-NextButton").attr("disabled", true);
      $("#BookingTime-Screen-ButtonsPanel-Summary").text("");
    }
  },
}