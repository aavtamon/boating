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
  phoneInput: function(phoneElement, dataModel, dataModelProperty, changeCallback) {
    $(phoneElement).keydown(function(event) {
      event.preventDefault();
      
      if (event.which >= 48 && event.which <= 57) {
        if (dataModel[dataModelProperty].length < 10) {
          phoneElement.setPhone(dataModel[dataModelProperty] + (event.which - 48));
          
          if (dataModel[dataModelProperty].length == 10) {
            if (changeCallback) {
              changeCallback(dataModel[dataModelProperty], true);
            }
          }
        }
      } else if (event.which == 8) {
        if (dataModel[dataModelProperty].length > 0) {
          phoneElement.setPhone(dataModel[dataModelProperty].substring(0, dataModel[dataModelProperty].length - 1));
        }
        if (dataModel[dataModelProperty].length == 9) {
          if (changeCallback) {
            changeCallback(dataModel[dataModelProperty], false);
          }
        }
      } else {
        return false;
      }
    });
    
    phoneElement.setPhone = function(phone) {
      dataModel[dataModelProperty] = phone;
      this.value = ScreenUtils.formatPhoneNumber(phone);
    }
    
    phoneElement.getPhone = function() {
      return dataModel[dataModelProperty];
    }
    
    
    phoneElement.setPhone(dataModel[dataModelProperty] || "");
  },
  
  dataModelInput: function(inputElement, dataModel, dataModelProperty, changeCallback) {
    if (dataModel[dataModelProperty] != null) {
      inputElement.value = dataModel[dataModelProperty];
    } else if (inputElement.value != null) {
      dataModel[dataModelProperty] = inputElement.value;
    }

    $(inputElement).change(function() {
      dataModel[dataModelProperty] = inputElement.value;
      if (changeCallback) {
        changeCallback(inputElement.value);
      }      
    });
  },
  
  
  isValid: function(value) {
    return value != null && value != "";
  },
  
  isValidEmail: function(value) {
    return value != null && value != "";
  },
  
  isValidPhone: function(value) {
    return value != null && value != "";
  },
  
  isValidCardNumber: function(value) {
    return value != null && value != "";
  },
  
  isValidCardCVC: function(value) {
    return value != null && value != "";
  },
}
