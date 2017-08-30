BookingPayment = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date == null || reservationContext.duration == null || reservationContext.location_id == null || reservationContext.adult_count == null || reservationContext.children_count == null) {
      Main.loadScreen("home");
    }

    $("#BookingPayment-Screen-ButtonsPanel-BackButton").click(function() {
      Main.loadScreen("booking_confirmation");
    });
    
    $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").click(function() {
      Backend.saveReservationContext(function(status) {
        Backend.pay(function(status) {
          Main.loadScreen("booking_complete");
        });
      });
    });
    
    $("#BookingPayment-Screen-ReservationSummary-Details").html(ScreenUtils.getBookingSummary(reservationContext));
    
    
    ScreenUtils.dataModelInput($("#BookingPayment-Screen-ContactInformation-Name-FirstName-Input")[0], reservationContext, "first_name", this._canProceedToNextStep.bind(this));
    
    ScreenUtils.dataModelInput($("#BookingPayment-Screen-ContactInformation-Name-LastName-Input")[0], reservationContext, "last_name", this._canProceedToNextStep.bind(this));

    ScreenUtils.dataModelInput($("#BookingPayment-Screen-ContactInformation-Contact-Email-Input")[0], reservationContext, "email", this._canProceedToNextStep.bind(this));
    
    ScreenUtils.phoneInput($("#BookingPayment-Screen-ContactInformation-Contact-CellPhone-Input")[0], reservationContext, "mobile_phone", this._canProceedToNextStep.bind(this), ScreenUtils.isValidPhone);

    ScreenUtils.phoneInput($("#BookingPayment-Screen-ContactInformation-Contact-AlternativePhone-Input")[0], reservationContext, "alternative_phone", this._canProceedToNextStep.bind(this), function(value) {
      return value == null || value.length == 0 || ScreenUtils.isValidPhone(value);
    });
    
    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Address-Street-Input")[0], reservationContext, "street_address", this._canProceedToNextStep.bind(this));

    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Address-Additional-Input")[0], reservationContext, "additional_address", this._canProceedToNextStep.bind(this));
    
    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Area-City-Input")[0], reservationContext, "city", this._canProceedToNextStep.bind(this));

    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Area-State-Input")[0], reservationContext, "state", this._canProceedToNextStep.bind(this));
    
    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Area-Zip-Input")[0], reservationContext, "zip", this._canProceedToNextStep.bind(this), ScreenUtils.isValidZip);
    
    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-CreditCard-Number-Input")[0], reservationContext, "credit_card", this._canProceedToNextStep.bind(this), ScreenUtils.isValidCardNumber);

    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-CreditCard-CVC-Input")[0], reservationContext, "credit_card_cvc", this._canProceedToNextStep.bind(this), ScreenUtils.isValidCardCVC);

    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-CreditCard-Expiration-Month")[0], reservationContext, "credit_card_expiration_month", this._canProceedToNextStep.bind(this));

    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-CreditCard-Expiration-Year")[0], reservationContext, "credit_card_expiration_year", this._canProceedToNextStep.bind(this));
    
    
    this._canProceedToNextStep();
  },
  
 
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    
    if (reservationContext.date != null && reservationContext.duration != null && reservationContext.location_id != null
        && reservationContext.adult_count != null && reservationContext.children_count != null
        && ScreenUtils.isValid(reservationContext.first_name) && ScreenUtils.isValid(reservationContext.last_name) && ScreenUtils.isValidEmail(reservationContext.email)
        && (ScreenUtils.isValidPhone(reservationContext.mobile_phone) || ScreenUtils.isValidPhone(reservationContext.alternative_phone))
        && ScreenUtils.isValid(reservationContext.street_address) && ScreenUtils.isValid(reservationContext.city) && ScreenUtils.isValidZip(reservationContext.zip)
        && ScreenUtils.isValidCardNumber(reservationContext.credit_card) && ScreenUtils.isValidCardCVC(reservationContext.credit_card_cvc)) {
         
      $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").removeAttr("disabled");
    } else {
      $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").attr("disabled", true);
    }
  },
}