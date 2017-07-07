BookingTime = {
  onLoad: function() {
    Backend.resetReservationContext();
    this._canProceedToNextStep();
    
    
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
        this._canProceedToNextStep();
        
        this._showTimes();
      }.bind(this),
      
      defaultDate: Backend.getCurrentDate(),
      minDate: Backend.getSchedulingBeginDate(),
      maxDate: Backend.getSchedulingEndDate()
    });
    
    $("#BookingTime-Screen-ButtonsPanel-NextButton").click(function() {
      Main.loadScreen("booking_location");
    });
  },
  
  onSelect: function() {
    
  },
    
  _showTimes: function() {
    $("#BookingTime-Screen-SelectionPanel-Duration-Durations").empty();
    $("#BookingTime-Screen-SelectionPanel-TimeFrame-Times").empty();
    Backend.getReservationContext().interval = null;
    this._canProceedToNextStep();
   
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
        
        this._showDurations();
      }.bind(this, interval));
      
      if (intervals.length == 1) {
        $(timeInterval).addClass("selected");
        Backend.getReservationContext().interval = interval;
        
        this._canProceedToNextStep();
      }
    }
  },
      
  _showDurations: function() {
    $("#BookingTime-Screen-SelectionPanel-Duration-Durations").empty();
    Backend.getReservationContext().duration = null;
    this._canProceedToNextStep();
    
    for (var i = Backend.getReservationContext().interval.minDuration; i <= Backend.getReservationContext().interval.maxDuration; i++) {
      var tripLength = i + (i == 1 ? " hour" : " hours"); 
      var duration = $("<div class=\"bookingtime-duration\">" + tripLength + "</div>").appendTo($("#BookingTime-Screen-SelectionPanel-Duration-Durations"));
      duration.click(function(duration, event) {
        $(".bookingtime-duration").removeClass("selected");
        $(event.target).addClass("selected");
        
        Backend.getReservationContext().duration = duration;
        this._canProceedToNextStep();
      }.bind(this, i));
      
      if (Backend.getReservationContext().interval.minDuration == Backend.getReservationContext().interval.maxDuration) {
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
      
      var tripDate = reservationContext.date.getMonth() + "/" + reservationContext.date.getDate() + "/" + reservationContext.date.getFullYear();

      var hours = reservationContext.interval.time.getHours();
      var ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      var tripTime = hours + ampm;
      
      var tripDuration = reservationContext.duration + (reservationContext.duration == 1 ? " hour" : " hours");
      var summaryInfo = "You selected " + tripDate + ", " + tripTime + " for " + tripDuration + ".";
      
      $("#BookingTime-Screen-ButtonsPanel-Summary").text(summaryInfo);
    } else {
      $("#BookingTime-Screen-ButtonsPanel-NextButton").attr("disabled", true);
      $("#BookingTime-Screen-ButtonsPanel-Summary").text("");
    }
  },
}