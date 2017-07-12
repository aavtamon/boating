ScreenUtils = {
  getBookingSummary: function(reservationContext) {
    var tripDate = reservationContext.date.getMonth() + "/" + reservationContext.date.getDate() + "/" + reservationContext.date.getFullYear();
    
    var hours = reservationContext.interval.time.getHours();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    var tripTime = hours + ampm;
    
    var tripDuration = reservationContext.duration + (reservationContext.duration == 1 ? " hour" : " hours");
    var summaryInfo = "You selected <b>" + tripDate + "</b>, <b>" + tripTime + "</b> for <b>" + tripDuration + "</b>";
    
    if (reservationContext.location != null) {
      summaryInfo += "<br>Pick up at <b>" + reservationContext.location.name + "</b>";
    }
    
    return summaryInfo;
  }
}