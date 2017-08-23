ScreenUtils = {
  getBookingDate: function(date) {
    return date.getMonth() + "/" + date.getDate() + "/" + date.getFullYear();
  },

  getBookingDuration: function(duration) {
    return duration + (duration == 1 ? " hour" : " hours");
  },
    
  getBookingTime: function(time) {
    var hours = time.getHours();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    var minutes = time.getMinutes();
    if (minutes < 10) {
      minutes = "0" + minutes;
    }
    
    var tripTime = hours + ":" + minutes + " " + ampm;
    
    return tripTime;
  },
  
  getLocation: function(locationId) {
    var locations = Backend.getLocations();
    for (var i in locations) {
      var location = locations[i];
      if (location.id == locationId) {
        return location;
      }
    }
    
    return null;
  },
  
  getBookingSummary: function(reservationContext) {
    var tripDate = this.getBookingDate(reservationContext.date);
    var tripTime = this.getBookingTime(reservationContext.date);
    var tripDuration = this.getBookingDuration(reservationContext.duration);
    var summaryInfo = "You selected <b>" + tripDate + "</b>, <b>" + tripTime + "</b> for <b>" + tripDuration + "</b>";
    
    if (reservationContext.location_id != null) {
      var location = this.getLocation(reservationContext.location_id);
      if (location != null) {
        summaryInfo += "<br>Pick up / drop off at <b>" + location.name + "</b>";
      }
    }
    
    return summaryInfo;
  },
  
  formatPhoneNumber: function(value) {
    var result = ["(", "_", "_", "_", ")", " ", "_", "_", "_", "-", "_", "_", "_", "_"];
    
    for (var i = 0; i < value.length; i++) {
      if (i >= 0 && i <= 2) {
        result[i + 1] = value.charAt(i);
      } else if (i >= 3 && i <= 5) {
        result[i + 3] = value.charAt(i);
      } else if (i >= 6 && i <= 9) {
        result[i + 4] = value.charAt(i);
      }
    }

    return result.join("");
  },
  
  
  // changeCallback(phoneNumber, completelyEntered)
  phoneInput: function(phoneElement, initialPhone, changeCallback) {
    $(phoneElement).keydown(function(event) {
      event.preventDefault();
      
      if (event.which >= 48 && event.which <= 57) {
        if (phoneElement._phoneNumber.length < 10) {
          phoneElement.setPhone(phoneElement._phoneNumber + (event.which - 48));
          
          if (phoneElement._phoneNumber.length == 10) {
            if (changeCallback) {
              changeCallback(phoneElement._phoneNumber, true);
            }
          }
        }
      } else if (event.which == 8) {
        if (phoneElement._phoneNumber.length > 0) {
          phoneElement.setPhone(phoneElement._phoneNumber.substring(0, phoneElement._phoneNumber.length - 1));
        }
        if (phoneElement._phoneNumber.length == 9) {
          if (changeCallback) {
            changeCallback(phoneElement._phoneNumber, false);
          }
        }
      } else {
        return false;
      }
    });
    
    phoneElement.setPhone = function(phone) {
      this._phoneNumber = phone;
      this.value = ScreenUtils.formatPhoneNumber(phone);
    }
    
    phoneElement.getPhone = function() {
      return this._phoneNumber;
    }
    
    
    phoneElement.setPhone(initialPhone || "");
  }
}