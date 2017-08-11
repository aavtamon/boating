ScreenUtils = {
  getBookingDate: function(reservationContext) {
    var bookingDate = new Date(reservationContext.date);
    return bookingDate.getMonth() + "/" + bookingDate.getDate() + "/" + bookingDate.getFullYear();
  },

  getBookingDuration: function(reservationContext) {
    return reservationContext.duration + (reservationContext.duration == 1 ? " hour" : " hours");
  },
    
  getBookingSummary: function(reservationContext) {
    var tripDate = this.getBookingDate(reservationContext);
    
    var hours = new Date(reservationContext.interval.time).getHours();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    var tripTime = hours + ampm;
    
    var tripDuration = this.getBookingDuration(reservationContext);
    var summaryInfo = "You selected <b>" + tripDate + "</b>, <b>" + tripTime + "</b> for <b>" + tripDuration + "</b>";
    
    if (reservationContext.location != null) {
      summaryInfo += "<br>Pick up at <b>" + reservationContext.location.name + "</b>";
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