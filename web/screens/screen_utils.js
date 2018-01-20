ScreenUtils = {
  LOCAL_TZ_OFFSET: new Date().getTimezoneOffset() * 60 * 1000,
  
  
  getBookingDate: function(dateMs) {
    var date = new Date(dateMs);
    return (date.getUTCMonth() + 1) + "/" + date.getUTCDate() + "/" + date.getUTCFullYear();
  },

  getBookingDuration: function(duration) {
    return duration + (duration == 1 ? " hour" : " hours");
  },

  getBookingPrice: function(price) {
    return "$" + price;
  },
    
  getBookingTime: function(timeMs) {
    var time = new Date(timeMs);
    var hours = time.getUTCHours();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    var minutes = time.getUTCMinutes();
    if (minutes < 10) {
      minutes = "0" + minutes;
    }
    
    var tripTime = hours + ":" + minutes + " " + ampm;
    
    return tripTime;
  },
  
  getBookingExtrasAndPrice: function(extras, allExtras) {
    var extraPrice = 0;
    var includedExtras = "";
    for (var name in extras) {
      if (extras[name] == true) {
        var extra = allExtras[name];
        
        if (includedExtras != "") {
          includedExtras += ", ";
        }
        includedExtras = extra.name + " (+$" + extra.price + ")";
        extraPrice += extra.price;
      }
    }
    
    return [includedExtras, extraPrice];
  },
  
  
  getBookingSummary: function(reservationContext) {
    var tripDate = this.getBookingDate(reservationContext.slot.time);
    var tripTime = this.getBookingTime(reservationContext.slot.time);
    var tripDuration = this.getBookingDuration(reservationContext.slot.duration);
    var bookingPrice = this.getBookingPrice(reservationContext.slot.price);
    var summaryInfo = "You selected <b>" + tripDate + "</b>, <b>" + tripTime + "</b> for <b>" + tripDuration + "</b> (" + bookingPrice + ")";
    
    if (reservationContext.pickup_location_id != null) {
      var location = Backend.getBookingConfiguration().locations[reservationContext.location_id].pickup_locations[reservationContext.pickup_location_id];
      if (location != null) {
        summaryInfo += "<br>Pick up / drop off at <b>" + location.name + "</b>";
      }
    }
    
    return summaryInfo;
  },
  
  
  formatPhoneNumber: function(value) {
    var result = ["(", "_", "_", "_", ")", " ", "_", "_", "_", "-", "_", "_", "_", "_"];
    
    if (value != null) {
      for (var i = 0; i < value.length; i++) {
        if (i >= 0 && i <= 2) {
          result[i + 1] = value.charAt(i);
        } else if (i >= 3 && i <= 5) {
          result[i + 3] = value.charAt(i);
        } else if (i >= 6 && i <= 9) {
          result[i + 4] = value.charAt(i);
        }
      }
    }

    return result.join("");
  },
  
  getDateForTime: function(timeMs) {
    var date = new Date(timeMs);
    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);

    return date;
  },
  
  
  
  
  phoneInput: function(phoneElement, dataModel, dataModelProperty, changeCallback, validationMethod) {
    $(phoneElement).addClass("input-field");
    
    phoneElement._setPhone = function(phone) {
      dataModel[dataModelProperty] = phone;
      this.value = ScreenUtils.formatPhoneNumber(phone);
    }
    
    phoneElement._onValueChange = function() {
      var isValid = this.isValid();
      if (isValid) {
          $(phoneElement).removeClass("invalid");
      } else {
        $(phoneElement).addClass("invalid");
      }        
      if (changeCallback) {
        changeCallback(dataModel[dataModelProperty], isValid);
      }      
    }
    
    
    $(phoneElement).keydown(function(event) {
      if (event.which >= 48 && event.which <= 57) {
        if (dataModel[dataModelProperty].length < 10) {
          phoneElement.setPhone(dataModel[dataModelProperty] + (event.which - 48));
        }
      } else if (event.which == 8) {
        if (dataModel[dataModelProperty].length > 0) {
          phoneElement.setPhone(dataModel[dataModelProperty].substring(0, dataModel[dataModelProperty].length - 1));
        }
      } else if (event.which == 9) {
        return true;
      }
      
      return false;
    });
    
    
    $(phoneElement).focusout(function() {
      phoneElement._onValueChange();
    });
    
    
    phoneElement.setPhone = function(phone) {
      phoneElement._setPhone(phone);
      
      phoneElement._onValueChange();
    }
    
    phoneElement.getPhone = function() {
      return dataModel[dataModelProperty];
    }
    
    phoneElement.isValid = function() {
      return validationMethod == null ? true : validationMethod(dataModel[dataModelProperty]);
    }
    

    phoneElement._setPhone(dataModel[dataModelProperty] || "");
  },
  
  checkbox: function(checkboxElement, dataModel, dataModelProperty, changeCallback) {
    $(checkboxElement).addClass("checkbox");
    $(checkboxElement).addClass("input-field");
    
    forLabel = $(checkboxElement).parent().find("label[for=" + $(checkboxElement).attr("id") + "]");
    if (forLabel.length == 1) {
      forLabel.css("user-select", "none");
      forLabel.click(function() {
        $(checkboxElement).click();
      })
    }
    
    $(checkboxElement).click(function() {
      if ($(checkboxElement).hasClass("checked")) {
        $(checkboxElement).removeClass("checked");
        dataModel[dataModelProperty] = false;
      } else {
        $(checkboxElement).addClass("checked");
        dataModel[dataModelProperty] = true;
      }
      
      if (changeCallback) {
        changeCallback(dataModel[dataModelProperty]);
      }      
    });
    
    if (dataModel[dataModelProperty] == null) {
      dataModel[dataModelProperty] = false;
    } else if (dataModel[dataModelProperty] == true) {
      $(checkboxElement).addClass("checked");
    }
  },
  
  dataModelInput: function(inputElement, dataModel, dataModelProperty, changeCallback, validationMethod, valueConverter) {
    $(inputElement).addClass("input-field");
    
    function _assingValue() {
      if (valueConverter) {
        dataModel[dataModelProperty] = valueConverter(inputElement.value);
      } else {
        dataModel[dataModelProperty] = inputElement.value;
      }
    }
    
    if (dataModel[dataModelProperty] != null) {
      inputElement.value = dataModel[dataModelProperty];
    } else if (inputElement.value != null) {
      _assingValue();
    }

    $(inputElement).change(function() {
      _assingValue();
      
      if (validationMethod) {
        if (validationMethod(dataModel[dataModelProperty])) {
          $(inputElement).removeClass("invalid");
        } else {
          $(inputElement).addClass("invalid");
        }        
      }
      if (changeCallback) {
        changeCallback(inputElement.value);
      }      
    });
    
    if (changeCallback) {
      $(inputElement).bind("input", function() {
          _assingValue();
          changeCallback(dataModel[dataModelProperty]);
      });
    }    
  },
  
  stateSelect: function(stateElement, dataModel, dataModelProperty, changeCallback) {
    $(stateElement).append("<option value='AL'>AL</option>");
    $(stateElement).append("<option value='AK'>AK</option>");
    $(stateElement).append("<option value='AZ'>AZ</option>");
    $(stateElement).append("<option value='AR'>AR</option>");
    $(stateElement).append("<option value='CA'>CA</option>");
    $(stateElement).append("<option value='CO'>CO</option>");
    $(stateElement).append("<option value='CT'>CT</option>");
    $(stateElement).append("<option value='DE'>DE</option>");
    $(stateElement).append("<option value='DC'>DC</option>");
    $(stateElement).append("<option value='FL'>FL</option>");
    $(stateElement).append("<option value='GA' selected='selected'>GA</option>");
    $(stateElement).append("<option value='HI'>HI</option>");
    $(stateElement).append("<option value='ID'>ID</option>");
    $(stateElement).append("<option value='IL'>IL</option>");
    $(stateElement).append("<option value='IN'>IN</option>");
    $(stateElement).append("<option value='IA'>IA</option>");
    $(stateElement).append("<option value='KS'>KS</option>");
    $(stateElement).append("<option value='KY'>KY</option>");
    $(stateElement).append("<option value='LA'>LA</option>");
    $(stateElement).append("<option value='ME'>ME</option>");
    $(stateElement).append("<option value='MD'>MD</option>");
    $(stateElement).append("<option value='MA'>MA</option>");
    $(stateElement).append("<option value='MI'>MI</option>");
    $(stateElement).append("<option value='MN'>MN</option>");
    $(stateElement).append("<option value='MS'>MS</option>");
    $(stateElement).append("<option value='MO'>MO</option>");
    $(stateElement).append("<option value='MT'>MT</option>");
    $(stateElement).append("<option value='NE'>NE</option>");
    $(stateElement).append("<option value='NV'>NV</option>");
    $(stateElement).append("<option value='NH'>NH</option>");
    $(stateElement).append("<option value='NJ'>NJ</option>");
    $(stateElement).append("<option value='MN'>MN</option>");
    $(stateElement).append("<option value='NY'>NY</option>");
    $(stateElement).append("<option value='NC'>NC</option>");
    $(stateElement).append("<option value='ND'>ND</option>");
    $(stateElement).append("<option value='OH'>OH</option>");
    $(stateElement).append("<option value='OK'>OK</option>");
    $(stateElement).append("<option value='OR'>OR</option>");
    $(stateElement).append("<option value='PA'>PA</option>");
    $(stateElement).append("<option value='RI'>RI</option>");
    $(stateElement).append("<option value='SC'>SC</option>");
    $(stateElement).append("<option value='SD'>SD</option>");
    $(stateElement).append("<option value='TN'>TN</option>");
    $(stateElement).append("<option value='TX'>TX</option>");
    $(stateElement).append("<option value='UT'>UT</option>");
    $(stateElement).append("<option value='VT'>VT</option>");
    $(stateElement).append("<option value='VA'>VA</option>");
    $(stateElement).append("<option value='WA'>WA</option>");
    $(stateElement).append("<option value='WI'>WI</option>");
    $(stateElement).append("<option value='WV'>WV</option>");
    
    this.dataModelInput(stateElement, dataModel, dataModelProperty, changeCallback);
  },
  
  

  getUTCMillis: function(localTime) {
    return Date.UTC(localTime.getFullYear(), localTime.getMonth(), localTime.getDate(),  localTime.getHours(), localTime.getMinutes(), localTime.getSeconds(), localTime.getMilliseconds());
  },
  
  getLocalTime: function(utcTimeMs) {
    return new Date(utcTimeMs + ScreenUtils.LOCAL_TZ_OFFSET);
  },
  
  
  pad: function(value, padding, pad) {
    var result = "";
    
    pad = pad || "&nbsp;";
    
    for (var i = padding - new String(value).length; i > 0; i--) {
      result += pad;
    }
    
    return result + value;
  },
  
  
  isValid: function(value) {
    return value != null && value != "";
  },
  
  isValidEmail: function(value) {
    var emailRE = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return value != null && emailRE.test(value);    
  },
  
  isValidPhone: function(value) {
    var phoneRE = /^[0-9]{10,10}$/;
    return value != null && phoneRE.test(value);
  },
  
  isValidZip: function(value) {
    var zipRE = /^[0-9]{5,5}$/;
    return value != null && zipRE.test(value);
  },
  
  isValidCardNumber: function(value) {
    var cardRE = /^[0-9]{16,16}$/;
    return value != null && cardRE.test(value);
  },
  
  isValidCardCVC: function(value) {
    var cvcRE = /^[0-9]{3,4}$/;
    return value != null && cvcRE.test(value);
  },
  
  isValidLicense: function(value) {
    var licenseRE = /^[0-9]{8,12}$/;
    return value != null && licenseRE.test(value);
  }
}
