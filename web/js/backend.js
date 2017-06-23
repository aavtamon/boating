Backend = {
    getCurrentDate: function() {
      return new Date("9/10/2002");
    },
    
    getSchedulingBeginDate: function() {
      return new Date("9/11/2002");
    },

    getSchedulingEndDate: function() {
      return new Date("11/12/2002");
    },
    
    getAvailableTimes: function(date) {
      var firstTime = new Date(date);
      firstTime.setHours(10, 0);
      
      var secondTime = new Date(date);
      secondTime.setHours(13, 0);

      return [{time: firstTime, duration: 2}, {time: secondTime, duration: 1}];
    }
}