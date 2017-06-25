Backend = {
    resevrationContext: {},
    
    
    resetReservationContext: function() {
      this.resevrationContext = {};
    },
    getReservationContext: function() {
      return this.resevrationContext;
    },
    
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
      if (date.getDate() == 19) {
        return [];
      }
      
      var firstTime = new Date(date);
      firstTime.setHours(10, 0);
      
      var secondTime = new Date(date);
      secondTime.setHours(13, 0);

      return [{time: firstTime, minDuration: 2, maxDuration: 2}, {time: secondTime, minDuration: 1, maxDuration: 2}];
    }
}