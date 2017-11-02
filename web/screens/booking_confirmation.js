BookingConfirmation = {
  maximumCapacity: null,
  
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();

    if (Backend.isPayedReservation() || reservationContext.slot == null || reservationContext.location_id == null) {
      Main.loadScreen("home");
      return;
    }
    

    $("#BookingConfirmation-Screen-Description-BackButton").click(function() {
      Main.loadScreen("booking_location");
    });
    
    $("#BookingConfirmation-Screen-Description-NextButton").click(function() {
      if (Backend.getReservationContext().mobile_phone == "" && !Backend.getTemporaryData().mobilePhoneDeclined) {
        Main.showMessage("Please provide the mobile phone", "Even though it is not required, we very much recommend that you provide the mobile phone.<br>You will really appreciate a few notifications that we will send as it will help you meet the boat in the right place. Would you like to proceed to payment anyway?", function(action) {
          if (action == Main.ACTION_OK) {
            Backend.getTemporaryData().mobilePhoneDeclined = true;
            Main.loadScreen("booking_payment");
          }
        }.bind(this), Main.DIALOG_TYPE_YESNO);
      } else {
        Main.loadScreen("booking_payment");
      }
    });
    

    if (Backend.getTemporaryData().ageCertification == null) {
      Backend.getTemporaryData().ageCertification = false;
    }
    
  
    reservationContext.adult_count = reservationContext.adult_count || 1;
    reservationContext.children_count = reservationContext.children_count || 0;
    
    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector", 1, this.maximumCapacity);
    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, this.maximumCapacity - reservationContext.adult_count);
        
    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector")[0], reservationContext, "adult_count", function(value) {
      var remainder = this.maximumCapacity - value;
      
      this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, remainder);
    }.bind(this), null, function(value) {
      return parseInt(value);
    });
        
    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector")[0], reservationContext, "children_count", null, null, function(value) {
      return parseInt(value);
    });
    

    $("#BookingConfirmation-Screen-ContactInformation-DL-Age-Checkbox").prop("checked", Backend.getTemporaryData().ageCertification);
    
    $("#BookingConfirmation-Screen-ContactInformation-DL-Age-Checkbox").change(function() {
      Backend.getTemporaryData().ageCertification = $("#BookingConfirmation-Screen-ContactInformation-DL-Age-Checkbox").is(':checked');
      this._canProceedToNextStep();
    }.bind(this));
    
    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-ContactInformation-DL-License-Input")[0], reservationContext, "dl", this._canProceedToNextStep.bind(this));
    
    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-ContactInformation-Name-FirstName-Input")[0], reservationContext, "first_name", this._canProceedToNextStep.bind(this));
    
    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-ContactInformation-Name-LastName-Input")[0], reservationContext, "last_name", this._canProceedToNextStep.bind(this));

    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-ContactInformation-Email-Input")[0], reservationContext, "email", this._canProceedToNextStep.bind(this), ScreenUtils.isValidEmail);
    
    ScreenUtils.phoneInput($("#BookingConfirmation-Screen-ContactInformation-MobilePhone-Phone-Input")[0], reservationContext, "mobile_phone", function(value, isValid) {
      if (isValid && (reservationContext.primary_phone == null || reservationContext.primary_phone == "")) {
        $("#BookingConfirmation-Screen-ContactInformation-Phone-PrimaryPhone-Input")[0].setPhone(value);
      }
      
      this._canProceedToNextStep();
    }.bind(this), function(value) {
      return value == null || value.length == 0 || ScreenUtils.isValidPhone(value);
    });
    
    ScreenUtils.phoneInput($("#BookingConfirmation-Screen-ContactInformation-Phone-PrimaryPhone-Input")[0], reservationContext, "primary_phone", this._canProceedToNextStep.bind(this), ScreenUtils.isValidPhone);

    ScreenUtils.phoneInput($("#BookingConfirmation-Screen-ContactInformation-Phone-AlternativePhone-Input")[0], reservationContext, "alternative_phone", this._canProceedToNextStep.bind(this), function(value) {
      return value == null || value.length == 0 || ScreenUtils.isValidPhone(value);
    });
    
    
    this._canProceedToNextStep();
  },
  
 
  _fillSelectorValues: function(selector, min, max) {
    var value = $(selector).val();
    var currentValue = value != null ? parseInt(value) : 0;
    
    $(selector).empty();
    for (var i = min; i <= max; i++) {
      $(selector).append("<option>" + i + "</option>");
    }
    
    if (currentValue < min) {
      $(selector).val(min);
    } else if (currentValue > max) {
      $(selector).val(max);
    } else {
      $(selector).val(currentValue);
    }
    
    $(selector).trigger("change");
  },
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    
    var reservationComplete = true;

    var valid = Backend.getTemporaryData().ageCertification && ScreenUtils.isValid(reservationContext.dl)
                && ScreenUtils.isValid(reservationContext.first_name) && ScreenUtils.isValid(reservationContext.last_name)
                && ScreenUtils.isValidEmail(reservationContext.email)
                && ScreenUtils.isValidPhone(reservationContext.primary_phone)
                && (reservationContext.alternative_phone == "" || ScreenUtils.isValidPhone(reservationContext.alternative_phone))
                && (reservationContext.mobile_phone == "" || ScreenUtils.isValidPhone(reservationContext.mobile_phone));

    $("#BookingConfirmation-Screen-Description-NextButton").prop("disabled", !valid);
  }
}