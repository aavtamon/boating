AdminDeposit = {
  
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    
    if (reservationContext.status != Backend.RESERVATION_STATUS_BOOKED) {
      Main.loadScreen("admin_home");
      
      return;
    }
    
    $("#AdminDeposit-Screen-Description-BackButton").click(function() {
      Main.loadScreen("admin_home");
    });
    
    
    if (Backend.getTemporaryData().paymentInfo == null) {
      Backend.getTemporaryData().paymentInfo = {card_ready: false, name: reservationContext.first_name + " " + reservationContext.last_name};
    }
    var paymentInfo = Backend.getTemporaryData().paymentInfo;
    paymentInfo.card_ready = false;
    
    
    var stripe = Stripe(Backend.PAYMENT_KEY);    
    var elements = stripe.elements();
    
    var style = {
      base: {
        color: '#32325d',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    };
    
    var card = elements.create("card", {style: style});
    card.mount("#AdminDeposit-Screen-PaymentInformation-CreditCard-Input");
    
    card.addEventListener("change", function(event) {
      $("#AdminDeposit-Screen-PaymentInformation-CreditCard-Status").html("");
      
      if (event.error) {
        $("#AdminDeposit-Screen-PaymentInformation-CreditCard-Status").html(event.error.message);
      }
      
      Backend.getTemporaryData().paymentInfo.card_ready = event.complete;
      this._canProceedToNextStep();
    }.bind(this));
    
    
    
    $("#AdminDeposit-Screen-Description-ConfirmButton").click(function() {
      this._pay(stripe, card);
    }.bind(this));
    

    var boat = Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id];
    $("#AdminDeposit-Screen-ReservationSummary-Boat-Value").html(boat.name);
    $("#AdminDeposit-Screen-ReservationSummary-Deposit-Value").html(ScreenUtils.getBookingPrice(boat.deposit));
    
    
    ScreenUtils.dataModelInput($("#AdminDeposit-Screen-PaymentInformation-Name-Input")[0], paymentInfo, "name", this._canProceedToNextStep.bind(this));

    ScreenUtils.dataModelInput($("#AdminDeposit-Screen-PaymentInformation-Address-Street-Input")[0], paymentInfo, "street_address", this._canProceedToNextStep.bind(this));

    ScreenUtils.dataModelInput($("#AdminDeposit-Screen-PaymentInformation-Address-Additional-Input")[0], paymentInfo, "additional_address", this._canProceedToNextStep.bind(this));
    
    ScreenUtils.dataModelInput($("#AdminDeposit-Screen-PaymentInformation-Area-City-Input")[0], paymentInfo, "city", this._canProceedToNextStep.bind(this));

    ScreenUtils.stateSelect($("#AdminDeposit-Screen-PaymentInformation-Area-State-Input")[0], paymentInfo, "state", this._canProceedToNextStep.bind(this));
    
    this._canProceedToNextStep();
  },
  
  
  _pay: function(stripe, card) {
    Main.showPopup("Deposit Processing", "Deposit is being processed.<br>Do not refresh or close your browser");

    var paymentInfo = Backend.getTemporaryData().paymentInfo;
    
    var cardData = {
      name: paymentInfo.name,
      address_line1: paymentInfo.street_address,
      address_line2: paymentInfo.additional_address,
      address_city: paymentInfo.city,
      address_state: paymentInfo.state,
      address_country: "US",
      currency: "usd"
    }

    stripe.createToken(card, cardData).then(function(result) {
      if (result.error) {
        Main.showMessage("Payment Not Successful", result.error.message);
      } else {
        Backend.payDeposit(result.token.id, function(status) {
          if (status == Backend.STATUS_SUCCESS) {
            Backend.getTemporaryData().paymentInfo = null;
            
            Backend.getReservationContext().status = Backend.RESERVATION_STATUS_DEPOSITED;
            Backend.saveReservation(function(status) {
              if (status == Backend.STATUS_SUCCESS) {
                Main.hidePopup();
                Backend.resetReservationContext();
                Main.loadScreen("admin_home");
              } else {
                Main.showMessage("Update Not Successful", "Reservation can not be updated.");
              }
            });
          } else {
            Main.showMessage("Payment Not Successful", "Something went wrong. Please try again");
          }
        });
      }
    });    
  },

  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    var paymentInfo = Backend.getTemporaryData().paymentInfo;
        
    var valid = ScreenUtils.isValid(paymentInfo.name) && ScreenUtils.isValid(paymentInfo.street_address) && ScreenUtils.isValid(paymentInfo.city) && (paymentInfo.card_ready == true);
         
    $("#AdminDeposit-Screen-Description-ConfirmButton").prop("disabled", !valid);
  },
}