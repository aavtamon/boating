Backend = {
    _reservationContext: {},
    
    
    resetReservationContext: function() {
      this._reservationContext = {};
    },
    getReservationContext: function() {
      return this._reservationContext;
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

      return [{time: firstTime, minDuration: 2, maxDuration: 2, id: 1}, {time: secondTime, minDuration: 1, maxDuration: 2, id: 2}];
    },
    
    getLocationInfo: function(locationId) {
      if (locationId == 1) {
        return {name: "Great Marina", address: "1745 Lanier Islands Parkway, Suwanee 30024"};
      } else if (locationId == 2) {
        return {name: "Parking lot at the beach", address: "1111 Lanier Islands Parkway, Suwanee 30024"};
      } else if (locationId == 3) {
        return {name: "Dam parking", address: "2222 Buford Highway, Cumming 30519"};
      } else {
        return null;
      }
    }
}