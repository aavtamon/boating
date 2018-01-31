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
    }.bind(this));
    
    
    
    $("#AdminDeposit-Screen-Description-ConfirmButton").click(function() {
      if (Backend.getTemporaryData().paymentInfo.card_ready) {
        $("#AdminDeposit-Screen-SubmitButton").click();
      } else {
        $("#AdminDeposit-Screen-PaymentInformation-CreditCard-Status").html("Please provide credit card information.");
      }
    });

    
    var boat = Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id];
    $("#AdminDeposit-Screen-ReservationSummary-Boat-Value").html(boat.name);
    $("#AdminDeposit-Screen-ReservationSummary-Deposit-Value").html(ScreenUtils.getBookingPrice(boat.deposit));
    
    
    ScreenUtils.dataModelInput($("#AdminDeposit-Screen-PaymentInformation-Name-Input")[0], paymentInfo, "name");

    ScreenUtils.dataModelInput($("#AdminDeposit-Screen-PaymentInformation-Address-Street-Input")[0], paymentInfo, "street_address");

    ScreenUtils.dataModelInput($("#AdminDeposit-Screen-PaymentInformation-Address-Additional-Input")[0], paymentInfo, "additional_address");
    
    ScreenUtils.dataModelInput($("#AdminDeposit-Screen-PaymentInformation-Area-City-Input")[0], paymentInfo, "city");

    ScreenUtils.stateSelect($("#AdminDeposit-Screen-PaymentInformation-Area-State-Input")[0], paymentInfo, "state");

    
    ScreenUtils.form("#AdminDeposit-Screen", null, this._pay.bind(this, stripe, card));
  },
  
  
  _pay: function(stripe, card) {
    Main.showPopup("Deposit Processing", '<center style="font-size: 20px;">Your deposit is being processed.<br>Do not refresh or close your browser</center>');

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
}