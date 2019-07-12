OwnerBooking = {
  ownerAccount: null,
  availableSlots: null,
  currentTime: null,

  
  onLoad: function() {
    if (this.ownerAccount == null) {
      Main.loadScreen("owner_login");
      return;
    }


    var schedulingBeginDate = Date.parse(Backend.getBookingConfiguration().scheduling_begin_date);
    var schedulingEndDate = Date.parse(Backend.getBookingConfiguration().scheduling_end_date);

    var bookingBeginDate = ScreenUtils.getDateForTime(this.currentTime).getTime();
    if (schedulingBeginDate > bookingBeginDate) {
      bookingBeginDate = schedulingBeginDate;
    }
    
    
    this._selectedDate = bookingBeginDate;
    this._selectedTime = null;
    this._selectedDuration = null;
    
    this._locationId = null;
    this._boatId = null;
    this._slot = null;
    
    $("#OwnerBooking-Screen-SelectionPanel-Calendar").datepicker({
      beforeShowDay: function(date) {
        var slotType = OwnerBooking.availableSlots[ScreenUtils.getUTCMillis(date)];
        var isSelectable = slotType != Backend.SLOT_TYPE_NONE;

        return [isSelectable, "", null];
      },
      
      onSelect: function(dateText, instance) {
        var newSelectedDate = ScreenUtils.getUTCMillis(new Date(dateText));
        
        if (newSelectedDate == this._selectedDate) {
          return;
        }
        
        this._selectedDate = newSelectedDate;
        this._slot = null;
        
        this._canProceedToNextStep();
        
        this._showTimes();
      }.bind(this),
      
      defaultDate: ScreenUtils.getLocalTime(this._selectedDate),
      minDate: ScreenUtils.getLocalTime(bookingBeginDate),
      maxDate: ScreenUtils.getLocalTime(schedulingEndDate)
    });
    
    
    $("#OwnerBooking-Screen-Description-BackButton").click(function() {
      Main.loadScreen("owner_home");
    });
    
    $("#OwnerBooking-Screen-Description-BookButton").click(function() {
      Main.showPopup("Booking Processing...", 'Your booking is being processed.<br>Do not refresh or close your browser.');
      
      Backend.resetReservationContext();
      
      var reservationContent = Backend.getReservationContext();
      reservationContent.owner_account_id = this.ownerAccount.id;
      reservationContent.location_id = this._locationId;
      reservationContent.boat_id = this._boatId;
      reservationContent.slot = this._slot;
      
      Backend.saveReservation(function(status, reservationId) {
        if (status == Backend.STATUS_SUCCESS) {
          Main.showMessage("Reservation confirmed", "Your reservation <a href=\"#owner_reservation_update?id=" + reservationId + "\">" + reservationId + "</a> is booked.", function(action) {
            Main.loadScreen("owner_home");
          });
        } else {
          Main.showMessage("Not Successful", "An error occured. Please try again");
        }
      }.bind(this));
    }.bind(this));
    
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

          this._locationId = event.target._locationId;
          this._boatId = event.target._boatId;

          this._canProceedToNextStep();
        }.bind(this));

        if (boatId == this._boatId) {
          boatOption.click();
        }
      }
    }

    var boatOptions = $(".boats");
    if (boatOptions.length == 1 && this._boatId == null) {
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
        
        Object.keys(times).sort().forEach(function(time) {
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

            this._slot = null;
            this._selectedTime = event.target._time;

            this._canProceedToNextStep();

            this._showDurations(times[event.target._time]);
          }.bind(this));
          
          if (time == this._selectedTime) {
            timeInterval.click();
          }
        }.bind(this));
        
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
      var durationElement = $("<div class=\"optionbox-option durations\">" + ScreenUtils.getBookingDuration(slot.duration) + "</div>").appendTo($("#OwnerBooking-Screen-SelectionPanel-Duration-Durations"));
      durationElement[0]._slot = slot;
      
      durationElement.click(function(event) {
        $(".durations").removeClass("selected");
        $(event.target).addClass("selected");
        
        this._selectedDuration = event.target._slot.duration;
        this._slot = event.target._slot;

        this._canProceedToNextStep();
      }.bind(this));
      
      if (slot.duration == this._selectedDuration) {
        durationElement.click();
      }
    }
    
    if (slots.length == 1 && this._selectedDuration == null) {
      $(".durations").addClass("selected");
      this._slot = slots[0];

      this._canProceedToNextStep();
    }
  },
  
  
  
  _canProceedToNextStep: function() {
    if (this._locationId != null && this._boatId != null && this._slot != null) {
      $("#OwnerBooking-Screen-Description-BookButton").prop("disabled", false);

      $("#OwnerBooking-Screen-ReservationSummary").html("You selected " + Backend.getBookingConfiguration().locations[this._locationId].boats[this._boatId].name + ", " + ScreenUtils.getBookingDate(this._slot.time) + " " + ScreenUtils.getBookingTime(this._slot.time) + ", " + ScreenUtils.getBookingDuration(this._slot.duration));
    } else {
      $("#OwnerBooking-Screen-Description-BookButton").prop("disabled", true);
      $("#OwnerBooking-Screen-ReservationSummary").html("Book your personal boat usage");
    }
  },
}