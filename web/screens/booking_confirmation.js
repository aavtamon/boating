BookingConfirmation = {
  maximumCapacity: null,
  
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();

    if (Backend.isPayedReservation() || reservationContext.slot == null || reservationContext.location_id == null) {
      Main.loadScreen("home");
      return;
    }
    

    $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").checkboxradio();
    
    $("#BookingConfirmation-Screen-Description-BackButton").click(function() {
      Main.loadScreen("booking_location");
    });
    
    $("#BookingConfirmation-Screen-Description-NextButton").click(function() {
      Main.loadScreen("booking_payment");
    });
    
    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector", 1, this.maximumCapacity);
    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, this.maximumCapacity - 1);
    

    reservationContext.adult_count = reservationContext.adult_count || 1;
    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector")[0], reservationContext, "adult_count", function(value) {
      var remainder = this.maximumCapacity - parseInt(value);
      
      this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, remainder);
    }.bind(this));
        
    reservationContext.children_count = reservationContext.children_count || 0;
    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector")[0], reservationContext, "children_count");

    ScreenUtils.phoneInput($("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value")[0], reservationContext, "mobile_phone", function(value, isValid) {
      if (isValid && (reservationContext.primary_phone == null || reservationContext.primary_phone == "")) {
        $("#BookingConfirmation-Screen-ContactInformation-Phone-PrimaryPhone-Input")[0].setPhone(value);
      }
      
      this._canProceedToNextStep();
    }.bind(this), function(value) {
        return $("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value").prop("disabled") == true
               || ScreenUtils.isValidPhone(value);
    });
    
    $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").change(function(event) {
      var isDisabled = $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").is(':checked');
      $("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value").prop("disabled", isDisabled);
      
      reservationContext.no_mobile_phone = isDisabled;
      
      if (isDisabled) {
        $("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value")[0].setPhone("");
      }
      
      this._canProceedToNextStep();
    }.bind(this));
    
    if (reservationContext.no_mobile_phone) {
      $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").attr("checked", true).change();
    }
    
    
    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-ContactInformation-Name-FirstName-Input")[0], reservationContext, "first_name", this._canProceedToNextStep.bind(this));
    
    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-ContactInformation-Name-LastName-Input")[0], reservationContext, "last_name", this._canProceedToNextStep.bind(this));

    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-ContactInformation-Email-Input")[0], reservationContext, "email", this._canProceedToNextStep.bind(this), ScreenUtils.isValidEmail);
    
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
  },
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    
    var reservationComplete = true;

    var valid = (reservationContext.no_mobile_phone || ScreenUtils.isValidPhone(reservationContext.mobile_phone)) 
        && ScreenUtils.isValid(reservationContext.first_name) && ScreenUtils.isValid(reservationContext.last_name)
        && ScreenUtils.isValidEmail(reservationContext.email)
        && (ScreenUtils.isValidPhone(reservationContext.primary_phone) || ScreenUtils.isValidPhone(reservationContext.alternative_phone));
    
    $("#BookingConfirmation-Screen-Description-NextButton").prop("disabled", !valid);
    
    
//    reservationContext.adult_count = parseInt($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector").val());
//    reservationContext.children_count = parseInt($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector").val());
    
    
    
  }
}