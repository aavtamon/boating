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
  
  
  getCenterLocation: function() {
    return {lat: 34.2288159, lng: -83.9592255, zoom: 11};
  },
  
  getLocations: function() {
    return [
      {id: 1, lat: 34.2169323, lng: -83.9452699, name: "Great Marina", address: "1745 Lanier Islands Parkway, Suwanee 30024"},
      {id: 2, lat: 34.2305583, lng: -83.9294771, name: "Parking lot at the beach", address: "1111 Lanier Islands Parkway, Suwanee 30024"},
      {id: 3, lat: 34.2700139, lng: -83.8967458, name: "Dam parking", address: "2222 Buford Highway, Cumming 30519"}
    ];
  }
}