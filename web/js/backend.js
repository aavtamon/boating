Backend = {
  STATUS_SUCCESS: "success",
  STATUS_ERROR: "error",
  STATUS_CONFLICT: "conflict",
  STATUS_BAD_REQUEST: "bad_request",
  
  
  PAYMENT_STATUS_PAYED: "payed",
  
  
  // Current reservation management
  _reservationContext: {},
  
  _temporaryData: {},
    
  getReservationContext: function() {
    return this._reservationContext;
  },
  
  getTemporaryData: function() {
    return this._temporaryData;
  },
  
  
  restoreReservationContext: function(reservationId, lastName, callback) {
    this._communicate("reservation/booking/?reservation_id=" + reservationId + "&last_name=" + lastName, "get", null, true, [], {
      success: function(persistentContext) {
        //this._reservationContext = this._convertPersistentToReservationContext(persistentContext);
        this._reservationContext = persistentContext;
        
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
  
  
  saveReservation: function(callback) {
    //var persistentContext = this._convertReservationToPersistentContext(this._reservationContext);
    var persistentContext = this._reservationContext;

    this._communicate("reservation/booking", "put", persistentContext, true, [], {
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
  

  removeReservation: function(reservationId, callback) {
    this._communicate("reservation/booking/?reservation_id=" + reservationId, "delete", null, true, [], {
      success: function(persistentContext) {
        //this._reservationContext = this._convertPersistentToReservationContext(persistentContext);
        this._reservationContext = persistentContext;
        
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
  
  
  pay: function(callback) {
    //var persistentContext = this._convertReservationToPersistentContext(this._reservationContext);
    var persistentContext = this._reservationContext;
    
    this._communicate("reservation/payment", "put", persistentContext, true, [], {
      success: function(persistentContext) {
        //this._reservationContext = this._convertPersistentToReservationContext(persistentContext);  
        this._reservationContext = persistentContext;
        
        if (callback) {
          callback(Backend.STATUS_SUCCESS);
        }
      }.bind(this),
      error: function(request, status) {
        if (callback) {
          if (status == 409) {
            callback(Backend.STATUS_CONFLICT);
          } else if (status == 400) {
            callback(Backend.STATUS_BAD_REQUEST);
          } else {
            callback(Backend.STATUS_ERROR);
          }
        }
      }
    });
  },
  
  
//  _convertPersistentToReservationContext: function(persistentContext) {
//    return {
//      id: persistentContext.id,
//      slot: persistentContext.slot,
//      location_id: persistentContext.location_id,
//      adult_count: persistentContext.adult_count,
//      children_count: persistentContext.children_count,
//      mobile_phone: persistentContext.mobile_phone,
//      no_mobile_phone: persistentContext.no_mobile_phone,
//      first_name: persistentContext.first_name,
//      last_name: persistentContext.last_name,
//      email: persistentContext.email,
//      cell_phone: persistentContext.cell_phone,
//      alternative_phone: persistentContext.alternative_phone,
//      street_address: persistentContext.street_address,
//      additional_address: persistentContext.additional_address,
//      city: persistentContext.city,
//      state: persistentContext.state,
//      zip: persistentContext.zip,
//      credit_card: persistentContext.credit_card,
//      credit_card_cvc: persistentContext.credit_card_cvc,
//      credit_card_expiration_month: persistentContext.credit_card_expiration_month,
//      credit_card_expiration_year: persistentContext.credit_card_expiration_year,
//      payed: persistentContext.payed
//    }
//  },
//  
//  _convertReservationToPersistentContext: function(reservationContext) {
//    return {
//      slot: reservationContext.slot,
//      location_id: reservationContext.location_id,
//      adult_count: parseInt(reservationContext.adult_count),
//      children_count: parseInt(reservationContext.children_count),
//      mobile_phone: reservationContext.mobile_phone,
//      no_mobile_phone: reservationContext.no_mobile_phone,
//      first_name: reservationContext.first_name,
//      last_name: reservationContext.last_name,
//      email: reservationContext.email,
//      cell_phone: reservationContext.cell_phone,
//      alternative_phone: reservationContext.alternative_phone,
//      street_address: reservationContext.street_address,
//      additional_address: reservationContext.additional_address,
//      city: reservationContext.city,
//      state: reservationContext.state,
//      zip: reservationContext.zip,
//      credit_card: reservationContext.credit_card,
//      credit_card_cvc: reservationContext.credit_card_cvc,
//      credit_card_expiration_month: reservationContext.credit_card_expiration_month,
//      credit_card_expiration_year: reservationContext.credit_card_expiration_year      
//    }
//  },

  
  // Bookings mansgement
  availableLocations: [],

  getAvailableLocations: function() {
    return this.availableLocations;
  },
  
  
  getAvailableSlots: function(date, callback) {
    this._communicate("bookings/available_slots?date=" + date.getTime(), "get", null, true, [], {
      success: function(slots) {
        if (callback) {
          callback(Backend.STATUS_SUCCESS, slots);
        }
      }.bind(this),
      error: function() {
        if (callback) {
          callback(Backend.STATUS_ERROR);
        }
      }
    });
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
    var url = resource;
    
    request.open(method, url, true);
    request.setRequestHeader("content-type", "application/json");
    for (var name in headers) {
      request.setRequestHeader(name, headers[name]);
    }

    request.send(data != null ? JSON.stringify(data) : "");  
  },
}