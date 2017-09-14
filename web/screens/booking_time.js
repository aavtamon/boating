BookingTime = {
  availableSlots: {},
  
  onLoad: function() {
    if (Backend.getReservationContext().date == null) {
      Backend.getReservationContext().date = Backend.getCurrentDate();
    }
    
    
    $("#BookingTime-Screen-SelectionPanel-Calendar").datepicker({
      beforeShowDay: function(date) {
        var isSelectable = BookingTime.availableSlots[date.getTime()] > 0;
        
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
   
    var intervals = Backend.getAvailableSlots(Backend.getReservationContext().date, function(status, slots) {
      if (status == Backend.STATUS_SUCCESS) {
        for (var i in slots) {
          var slot = slots[i];
          var slotTime = new Date(slot.time)

          var timeInterval = $("<div class=\"bookingtime-time-interval\">" + ScreenUtils.getBookingTime(slotTime) + " (" + ScreenUtils.getBookingDuration(slot.max_duration) + " max)</div>").appendTo($("#BookingTime-Screen-SelectionPanel-TimeFrame-Times"));
          timeInterval.click(function(slot, event) {
            $(".bookingtime-time-interval").removeClass("selected");
            $(event.target).addClass("selected");

            Backend.getReservationContext().duration = null;

            this._canProceedToNextStep();

            this._showDurations(slot);
          }.bind(this, slot));


          if (slots.length == 1) {
            $(timeInterval).addClass("selected");
            this._canProceedToNextStep();

            this._showDurations(slots[0]);
          }
        }
      }
    }.bind(this));
  },
      
  _showDurations: function(slot) {
    $("#BookingTime-Screen-SelectionPanel-Duration-Durations").empty();
    
    for (var i = slot.min_duration; i <= slot.max_duration; i++) {
      var tripLength = i + (i == 1 ? " hour" : " hours"); 
      var duration = $("<div class=\"bookingtime-duration\">" + tripLength + "</div>").appendTo($("#BookingTime-Screen-SelectionPanel-Duration-Durations"));
      duration.click(function(duration, event) {
        $(".bookingtime-duration").removeClass("selected");
        $(event.target).addClass("selected");

        Backend.getReservationContext().duration = duration;
        this._canProceedToNextStep();
      }.bind(this, i));


      if (slot.min_duration == slot.max_duration
          || Backend.getReservationContext().duration == i) {

        $(duration).addClass("selected");
        Backend.getReservationContext().duration = slot.min_duration;

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