Backend = {
  STATUS_SUCCESS: "success",
  STATUS_ERROR: "error",
  
  
  _reservationContext: {},
    
  getReservationContext: function() {
    return this._reservationContext;
  },
  
  saveReservationContext: function(callback) {
    var persistentContext = this._convertReservationToPersistentContext(this._reservationContext);

    this._communicate("", "put", persistentContext, true, [], {
      success: function(reportedContext) {
        //this._reservationContext = this._convertPersistentToReservationContext(reportedContext);
        
        if (callback) {
          callback(Backend.STATUS_SUCCESS);
        }
      }.bind(this),
      error: function() {
        if (callback) {
          callback(Backend.STATUS_ERROR);
        }
      }
    });
  },
  
  restoreReservationContext: function(callback) {
    this._communicate("", "get", null, true, [], {
      success: function(persistentContext) {
        //this._reservationContext = this._convertPersistentToReservationContext(persistentContext);
        
        if (callback) {
          callback(Backend.STATUS_SUCCESS);
        }
      }.bind(this),
      error: function() {
        if (callback) {
          callback(Backend.STATUS_ERROR);
        }
      }
    });
  },

  resetReservationContext: function(callback) {
    this._reservationContext = {};
    if (callback) {
      callback(Backend.STATUS_SUCCESS);
    }
  },
  
  
  _convertPersistentToReservationContext: function(persistentContext) {
    return {
      id: Utils.getCookie("sessionId"),
      date: new Date(persistentContext.date_time),
      duration: persistentContext.duration,
      location_id: persistentContext.location_id,
      adult_count: persistentContext.adult_count,
      children_count: persistentContext.children_count,
      mobile_phone: persistentContext.mobile_phone,
      no_mobile_phone: persistentContext.no_mobile_phone,
      first_name: persistentContext.first_name,
      last_name: persistentContext.last_name,
      email: persistentContext.email,
      alternative_phone: persistentContext.alternative_phone,
      street_address: persistentContext.street_address,
      additional_address: persistentContext.additional_address,
      city: persistentContext.city,
      state: persistentContext.state,
      zip: persistentContext.zip,
      credit_card: persistentContext.credit_card,
      credit_card_cvc: persistentContext.credit_card_cvc,
      credit_card_expiration_month: persistentContext.credit_card_expiration_month,
      credit_card_expiration_year: persistentContext.credit_card_expiration_year      
    }
  },
  
  _convertReservationToPersistentContext: function(reservationContext) {
    return {
      date_time: reservationContext.date.getTime(),
      duration: reservationContext.duration,
      location_id: reservationContext.location_id,
      adult_count: parseInt(reservationContext.adult_count),
      children_count: parseInt(reservationContext.children_count),
      mobile_phone: reservationContext.mobile_phone,
      no_mobile_phone: reservationContext.no_mobile_phone,
      first_name: reservationContext.first_name,
      last_name: reservationContext.last_name,
      email: reservationContext.email,
      alternative_phone: reservationContext.alternative_phone,
      street_address: reservationContext.street_address,
      additional_address: reservationContext.additional_address,
      city: reservationContext.city,
      state: reservationContext.state,
      zip: reservationContext.zip,
      credit_card: reservationContext.credit_card,
      credit_card_cvc: reservationContext.credit_card_cvc,
      credit_card_expiration_month: reservationContext.credit_card_expiration_month,
      credit_card_expiration_year: reservationContext.credit_card_expiration_year      
    }
  },


  _communicate: function(resource, method, data, isJsonResponse, headers, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState == 4) {
        if (request.status >= 200 && request.status < 300) {
          var text = request.responseText;
          if (isJsonResponse) {
            try {
              text = JSON.parse(request.responseText);
            } catch (e) {
              callback.error(request, request.status, request.responseText);
            }
          }
          callback.success(text, request.status, request);
        } else {
          callback.error(request, request.status, request.responseText);
        }
      }
    }

    
    //var url = window.location.protocol + "//" + window.location.hostname + ":8081/" + resource;
    var url = "reservation/" + resource;
    console.debug("Request URL: " + url);
    
    request.open(method, url, true);
    request.setRequestHeader("content-type", "application/json");
    for (var name in headers) {
      request.setRequestHeader(name, headers[name]);
    }

    request.send(data != null ? JSON.stringify(data) : "");  
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
  
  
  getMaximumCapacity: function() {
    return 10;
  },
  
  
  getCenterLocation: function() {
    return {lat: 34.2288159, lng: -83.9592255, zoom: 11};
  },
  
  getLocations: function() {
    return [
      {id: 1, lat: 34.2169323, lng: -83.9452699, name: "Great Marina", address: "1745 Lanier Islands Parkway, Suwanee 30024", parking_fee: "free", instructions: "none"},
      {id: 2, lat: 34.2305583, lng: -83.9294771, name: "Parking lot at the beach", address: "1111 Lanier Islands Parkway, Suwanee 30024", parking_fee: "$4 per car (cach only)", instructions: "proceed to the boat ramp"},
      {id: 3, lat: 34.2700139, lng: -83.8967458, name: "Dam parking", address: "2222 Buford Highway, Cumming 30519", parking_fee: "$3 per person (credit card accepted)", instructions: "follow 'boat ramp' signs"}
    ];
  }
}