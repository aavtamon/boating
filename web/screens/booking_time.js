BookingTime = {
  onLoad: function() {
    if (Backend.getReservationContext().date == null) {
      Backend.getReservationContext().date = Backend.getCurrentDate();
    }
    
    $("#BookingTime-Screen-SelectionPanel-Calendar").datepicker({
      beforeShowDay: function(date) {
        var isSelectable = Backend.getAvailableTimes(date).length > 0;
        
        return [isSelectable, "", null];
      },
      
      onSelect: function(dateText, instance) {
        var newSelectedDate = new Date(dateText);
        
        var reservationDate = new Date(Backend.getReservationContext().date);
        reservationDate.setHours(0);
        reservationDate.setMinutes(0);
        if (Backend.getReservationContext().date != null && newSelectedDate.getTime() == reservationDate.getTime()) {
          return;
        }
        Backend.getReservationContext().date = newSelectedDate;
        
        this._canProceedToNextStep();
        
        this._showTimes();
      }.bind(this),
      
      defaultDate: Backend.getReservationContext().date,
      minDate: Backend.getSchedulingBeginDate(),
      maxDate: Backend.getSchedulingEndDate()
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
   
    var intervals = Backend.getAvailableTimes(Backend.getReservationContext().date);
    for (var i in intervals) {
      var interval = intervals[i];
      
      var timeInterval = $("<div class=\"bookingtime-time-interval\">" + ScreenUtils.getBookingTime(interval.time) + " (" + ScreenUtils.getBookingDuration(interval.maxDuration) + " max)</div>").appendTo($("#BookingTime-Screen-SelectionPanel-TimeFrame-Times"));
      timeInterval.click(function(interval, event) {
        $(".bookingtime-time-interval").removeClass("selected");
        $(event.target).addClass("selected");
        
        Backend.getReservationContext().date.setHours(interval.time.getHours());
        Backend.getReservationContext().date.setMinutes(interval.time.getMinutes());
        
        this._canProceedToNextStep();

        Backend.getReservationContext().duration = null;
        this._showDurations();
      }.bind(this, interval));
      
      
      if (intervals.length == 1
          || (Backend.getReservationContext().date.getTime() == interval.time.getTime())) {
        
        $(timeInterval).addClass("selected");
        this._canProceedToNextStep();
        
        this._showDurations();
      }
    }
  },
      
  _showDurations: function() {
    $("#BookingTime-Screen-SelectionPanel-Duration-Durations").empty();
    
    var interval = null;
    var intervals = Backend.getAvailableTimes(Backend.getReservationContext().date);
    for (var i in intervals) {
      if (intervals[i].time.getTime() == Backend.getReservationContext().date.getTime()) {
        interval = intervals[i];
        break;
      }
    }
    
    for (var i = interval.minDuration; i <= interval.maxDuration; i++) {
      var tripLength = i + (i == 1 ? " hour" : " hours"); 
      var duration = $("<div class=\"bookingtime-duration\">" + tripLength + "</div>").appendTo($("#BookingTime-Screen-SelectionPanel-Duration-Durations"));
      duration.click(function(duration, event) {
        $(".bookingtime-duration").removeClass("selected");
        $(event.target).addClass("selected");
        
        Backend.getReservationContext().duration = duration;
        this._canProceedToNextStep();
      }.bind(this, i));
      
      
      if (interval.minDuration == interval.maxDuration
          || Backend.getReservationContext().duration == i) {
        
        $(duration).addClass("selected");
        Backend.getReservationContext().duration = interval.minDuration;
        
        this._canProceedToNextStep();
      }
    }
  },
  
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date != null && reservationContext.duration != null) {
      $("#BookingTime-Screen-ButtonsPanel-NextButton").removeAttr("disabled");
      
      $("#BookingTime-Screen-ButtonsPanel-Summary").html(ScreenUtils.getBookingSummary(reservationContext));
    } else {
      $("#BookingTime-Screen-ButtonsPanel-NextButton").attr("disabled", true);
      $("#BookingTime-Screen-ButtonsPanel-Summary").text("");
    }
  },
}