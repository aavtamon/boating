Backend = {
  STATUS_SUCCESS: "success",
  STATUS_ERROR: "error",
  STATUS_CONFLICT: "conflict",
  STATUS_BAD_REQUEST: "bad_request",
  STATUS_NOT_FOUND: "not_found",
    
  
  PAYMENT_STATUS_PAYED: "payed",
  
  RESERVATION_STATUS_BOOKED: "booked",
  RESERVATION_STATUS_DEPOSITED: "deposited",
  RESERVATION_STATUS_ACCIDENT: "accident",
  RESERVATION_STATUS_COMPLETED: "completed",
  
  OWNER_ACCOUNT_TYPE_ADMIN: "admin",
  
  PAYMENT_KEY: "pk_test_39gZjXaJ3YlMgPhFcISoz2MC",
  
  
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
    var params = "reservation_id=" + reservationId;
    if (lastName != null) {
      params += "&last_name=" + lastName;
    }
    
    this._communicate("reservation/booking/?" + params, "get", null, true, [], {
      success: function(persistentContext) {
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
    var persistentContext = this._reservationContext;

    this._communicate("reservation/booking/", "put", persistentContext, true, [], {
      success: function(persistentContext) {
        this._reservationContext = persistentContext;

        if (callback) {
          callback(Backend.STATUS_SUCCESS, persistentContext.id);
        }
      }.bind(this),
      error: function() {
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
  

  cancelReservation: function(reservationId, callback) {
    this._communicate("reservation/booking/?reservation_id=" + reservationId, "delete", null, false, [], {
      success: function() {
        if (callback) {
          callback(Backend.STATUS_SUCCESS);
        }
      }.bind(this),
      error: function() {
        if (callback) {
          if (status == 404) {
            callback(Backend.STATUS_NOT_FOUND);
          } else if (status == 400) {
            callback(Backend.STATUS_BAD_REQUEST);
          } else {
            callback(Backend.STATUS_ERROR);
          }
        }
      }
    });
  },
  
  sendConfirmationEmail: function(email, callback) {
    this._communicate("reservation/booking/email?email=" + email, "put", null, false, [], {
      success: function(persistentContext) {
        if (callback) {
          callback(Backend.STATUS_SUCCESS);
        }
      }.bind(this),
      error: function(request, status) {
        if (callback) {
          if (status == 404) {
            callback(Backend.STATUS_NOT_FOUND);
          } else if (status == 400) {
            callback(Backend.STATUS_BAD_REQUEST);
          } else {
            callback(Backend.STATUS_ERROR);
          }
        }
      }
    });    
  },


  

  resetReservationContext: function() {
    this._reservationContext = {};
    this._temporaryData = {};
  },
  
  
  payReservation: function(paymentToken, callback) {
    var paymentRequest = {
      reservation_id: this._reservationContext.id,
      payment_token: paymentToken
    }
    
    this._communicate("reservation/payment/", "put", paymentRequest, true, [], {
      success: function(persistentContext) {
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
          } else if (status == 404) {
            callback(Backend.STATUS_NOT_FOUND);
          } else {
            callback(Backend.STATUS_ERROR);
          }
        }
      }
    });
  },
  

  refundReservation: function(callback) {
    this._communicate("reservation/payment/?reservation_id=" + this._reservationContext.id, "delete", null, true, [], {
      success: function(persistentContext) {
        this._reservationContext = persistentContext;
        
        if (callback) {
          callback(Backend.STATUS_SUCCESS);
        }
      }.bind(this),
      error: function(request, status) {
        if (callback) {
          if (status == 404) {
            callback(Backend.STATUS_NOT_FOUND);
          } else if (status == 400) {
            callback(Backend.STATUS_BAD_REQUEST);
          } else {
            callback(Backend.STATUS_ERROR);
          }
        }
      }
    });
  },
    
  isPayedReservation: function() {
    return this._reservationContext.payment_status != null && this._reservationContext.payment_status != "";
  },
  
  
  
  payDeposit: function(paymentToken, callback) {
    var paymentRequest = {
      reservation_id: this._reservationContext.id,
      payment_token: paymentToken
    }
    
    this._communicate("reservation/payment/deposit", "put", paymentRequest, true, [], {
      success: function(persistentContext) {
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
          } else if (status == 404) {
            callback(Backend.STATUS_NOT_FOUND);
          } else {
            callback(Backend.STATUS_ERROR);
          }
        }
      }
    });
  },
  

  refundDeposit: function(callback) {
    this._communicate("reservation/payment/deposit?reservation_id=" + this._reservationContext.id, "delete", null, true, [], {
      success: function(persistentContext) {
        this._reservationContext = persistentContext;
        
        if (callback) {
          callback(Backend.STATUS_SUCCESS);
        }
      }.bind(this),
      error: function(request, status) {
        if (callback) {
          if (status == 404) {
            callback(Backend.STATUS_NOT_FOUND);
          } else if (status == 400) {
            callback(Backend.STATUS_BAD_REQUEST);
          } else {
            callback(Backend.STATUS_ERROR);
          }
        }
      }
    });
  },
  
  getPromoCode: function(promoCode, callback) {
    this._communicate("reservation/payment/promo?code=" + promoCode, "get", null, false, [], {
      success: function(discount) {
        if (callback) {
          callback(Backend.STATUS_SUCCESS, discount);
        }
      }.bind(this),
      error: function(request, status) {
        if (callback) {
          if (status == 400) {
            callback(Backend.STATUS_BAD_REQUEST);
          } else if (status == 404) {
            callback(Backend.STATUS_NOT_FOUND);
          } else {
            callback(Backend.STATUS_ERROR);
          }
        }
      }
    });
  },  

  
  
  // Booking management
  bookingConfiguration: null,

  getBookingConfiguration: function() {
    return this.bookingConfiguration;
  },
  
  
  getAvailableSlots: function(dateMs, callback) {
    this._communicate("bookings/available_slots?date=" + dateMs, "get", null, true, [], {
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
  
  
  
  // Account management
  
  logIn: function(username, password, callback) {
    this._communicate("account/?username=" + username + "&password=" + CryptoJS.MD5(password).toString(), "get", null, true, [], {
      success: function(account) {
        if (callback) {
          callback(Backend.STATUS_SUCCESS, account);
        }
      }.bind(this),
      error: function(request, status, message) {
        if (callback) {
          if (status == 400) {
            callback(Backend.STATUS_BAD_REQUEST, message);
          } else if (status == 401) {
            callback(Backend.STATUS_ERROR, message);
          } else if (status == 404) {
            callback(Backend.STATUS_NOT_FOUND, message);
          } else {
            callback(Backend.STATUS_ERROR);
          }
        }
      }
    });
  },
  
  logOut: function(callback) {
    this._communicate("account/logout", "get", null, true, [], {
      success: function() {
        this.accountDetails = null;
        if (callback) {
          callback(Backend.STATUS_SUCCESS);
        }
      }.bind(this),
      error: function(request, status, message) {
        if (callback) {
          callback(Backend.STATUS_ERROR);
        }
      }.bind(this)
    });
  },
  
  
  retrieveSafetyTestSuite: function(callback) {
    this._communicate("safety-test", "get", null, true, [], {
      success: function(testSuite) {
        if (callback) {
          callback(Backend.STATUS_SUCCESS, testSuite);
        }
      }.bind(this),
      error: function(request, status, message) {
        if (callback) {
          callback(Backend.STATUS_ERROR);
        }
      }.bind(this)
    });
  },
  
  submitSafetyTestSuite: function(suite, callback) {
    this._communicate("safety-test", "put", suite, true, [], {
      success: function(testSuite) {
        if (callback) {
          callback(Backend.STATUS_SUCCESS, testSuite);
        }
      }.bind(this),
      error: function(request, status, message) {
        if (callback) {
          callback(Backend.STATUS_ERROR);
        }
      }.bind(this)
    });
  },
  
  // Communication

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