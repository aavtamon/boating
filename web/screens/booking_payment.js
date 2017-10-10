BookingPayment = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.slot == null || reservationContext.location_id == null || reservationContext.adult_count == null || reservationContext.children_count == null) {
      Main.loadScreen("home");
    }

    $("#BookingPayment-Screen-ButtonsPanel-BackButton").click(function() {
      Main.loadScreen("booking_confirmation");
    });
    
    
    if (Backend.getTemporaryData().paymentInfo == null) {
      Backend.getTemporaryData().paymentInfo = {card_ready: false};
    }
    var paymentInfo = Backend.getTemporaryData().paymentInfo;
    
    
    var stripe = Stripe('pk_test_39gZjXaJ3YlMgPhFcISoz2MC');    
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
    card.mount("#BookingPayment-Screen-PaymentInformation-CreditCard-Input");
    
    card.addEventListener("change", function(event) {
      $("#BookingPayment-Screen-PaymentInformation-CreditCard-Status").html("");
      
      if (event.error) {
        $("#BookingPayment-Screen-PaymentInformation-CreditCard-Status").html(event.error.message);
      }
      
      paymentInfo.card_ready = event.complete;
      this._canProceedToNextStep();
    }.bind(this));
    
    
    
    $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").click(function() {
      Main.showPopup("Payment Processing", "Your payment is being processed.<br>Do not refresh or close your browser");
      
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
          Backend.getReservationContext().payment_token = result.token.id;
          
          Backend.pay(function(status) {
            Main.hidePopup();
            if (status == Backend.STATUS_SUCCESS) {
              Backend.getTemporaryData().paymentInfo = null;
              
              Main.loadScreen("booking_complete");
            } else if (status == Backend.STATUS_CONFLICT) {
              Main.showMessage("Payment Not Successful", "We are sorry, but it looks like this time was just booked. Please choose another one");
            } else if (status == Backend.STATUS_BAD_REQUEST) {
              Main.showMessage("Payment Not Successful", "Your payment did not get thru. Please check your payment details.");
            } else {
              Main.showMessage("Payment Not Successful", "Something went wrong. Please try again");
            }
          });
        }
      });
    });
    
    $("#BookingPayment-Screen-ReservationSummary-Details").html(ScreenUtils.getBookingSummary(reservationContext));
    
    
    
    function updateName() {
      $("#BookingPayment-Screen-PaymentInformation-Name-Input").val($("#BookingPayment-Screen-ContactInformation-Name-FirstName-Input").val() + " " + $("#BookingPayment-Screen-ContactInformation-Name-LastName-Input").val()).trigger("change");
    }
    
    ScreenUtils.dataModelInput($("#BookingPayment-Screen-ContactInformation-Name-FirstName-Input")[0], reservationContext, "first_name", function() {
      updateName();
      
      this._canProceedToNextStep();
    }.bind(this));
    
    ScreenUtils.dataModelInput($("#BookingPayment-Screen-ContactInformation-Name-LastName-Input")[0], reservationContext, "last_name", function() {
      updateName();
      
      this._canProceedToNextStep();
    }.bind(this));

    ScreenUtils.dataModelInput($("#BookingPayment-Screen-ContactInformation-Contact-Email-Input")[0], reservationContext, "email", this._canProceedToNextStep.bind(this), ScreenUtils.isValidEmail);
    
    
    if (reservationContext.cell_phone == null && reservationContext.mobile_phone != null) {
      reservationContext.cell_phone = reservationContext.mobile_phone;
    }
    ScreenUtils.phoneInput($("#BookingPayment-Screen-ContactInformation-Contact-CellPhone-Input")[0], reservationContext, "cell_phone", this._canProceedToNextStep.bind(this), ScreenUtils.isValidPhone);

    ScreenUtils.phoneInput($("#BookingPayment-Screen-ContactInformation-Contact-AlternativePhone-Input")[0], reservationContext, "alternative_phone", this._canProceedToNextStep.bind(this), function(value) {
      return value == null || value.length == 0 || ScreenUtils.isValidPhone(value);
    });
    
    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Name-Input")[0], paymentInfo, "name", this._canProceedToNextStep.bind(this));
    updateName();

    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Address-Street-Input")[0], paymentInfo, "street_address", this._canProceedToNextStep.bind(this));

    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Address-Additional-Input")[0], paymentInfo, "additional_address", this._canProceedToNextStep.bind(this));
    
    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Area-City-Input")[0], paymentInfo, "city", this._canProceedToNextStep.bind(this));

    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Area-State-Input")[0], paymentInfo, "state", this._canProceedToNextStep.bind(this));
    
    this._canProceedToNextStep();
  },
  
 
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    var paymentInfo = Backend.getTemporaryData().paymentInfo;
        
    if (ScreenUtils.isValid(reservationContext.first_name) && ScreenUtils.isValid(reservationContext.last_name) && ScreenUtils.isValidEmail(reservationContext.email)
        && (ScreenUtils.isValidPhone(reservationContext.cell_phone) || ScreenUtils.isValidPhone(reservationContext.alternative_phone))
        && ScreenUtils.isValid(paymentInfo.name) && ScreenUtils.isValid(paymentInfo.street_address) && ScreenUtils.isValid(paymentInfo.city)
        && paymentInfo.card_ready == true) {
         
      $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").removeAttr("disabled");
    } else {
      $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").attr("disabled", true);
    }
  },
}