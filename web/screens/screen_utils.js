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
  
  getBookingSummary: function(reservationContext) {
    var tripDate = this.getBookingDate(reservationContext.date);
    var tripTime = this.getBookingTime(reservationContext.date);
    var tripDuration = this.getBookingDuration(reservationContext.duration);
    var summaryInfo = "You selected <b>" + tripDate + "</b>, <b>" + tripTime + "</b> for <b>" + tripDuration + "</b>";
    
    if (reservationContext.location != null) {
      summaryInfo += "<br>Pick up / drop off at <b>" + reservationContext.location.name + "</b>";
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
  }
}