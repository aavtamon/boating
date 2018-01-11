BookingConfirmation = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();

    if (Backend.isPayedReservation() || reservationContext.pickup_location_id == null) {
      Main.loadScreen("home");
      return;
    }
    

    $("#BookingConfirmation-Screen-Description-BackButton").click(function() {
      Main.loadScreen("booking_location");
    });
    
    $("#BookingConfirmation-Screen-Description-NextButton").click(function() {
      Main.loadScreen("booking_payment");
    });

    
    if (Backend.getTemporaryData().ageCertification == null) {
      Backend.getTemporaryData().ageCertification = false;
    }
    
  
    reservationContext.adult_count = reservationContext.adult_count || 1;
    reservationContext.children_count = reservationContext.children_count || 0;
    
    var boat = Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id];
    $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Note-Number").html(boat.maximum_capacity);
    $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Note-BoatName").html(boat.name);


    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector", 1, boat.maximum_capacity);
    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, boat.maximum_capacity - reservationContext.adult_count);
        
    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector")[0], reservationContext, "adult_count", function(value) {
      var remainder = boat.maximum_capacity - value;
      
      this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, remainder);
    }.bind(this), null, function(value) {
      return parseInt(value);
    });
        
    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector")[0], reservationContext, "children_count", null, null, function(value) {
      return parseInt(value);
    });
    
    
    if (reservationContext.extras == null) {
      reservationContext.extras = {};
    }
    
    var extras = Backend.getBookingConfiguration().locations[reservationContext.location_id].extras;
    for (var name in extras) {
      var extra = extras[name];
      var extraId = "BookingConfirmation-Screen-AdditionalInformation-Equipment-Extras-" + name;
      $("#BookingConfirmation-Screen-AdditionalInformation-Equipment-Extras").append('<input type="checkbox" id="' + extraId + '">');
      $("#BookingConfirmation-Screen-AdditionalInformation-Equipment-Extras").append('<label for="' + extraId + '">' + extra.name + ' (+$' + extra.price + ')</label>');
      
      if (reservationContext.extras[name] == null) {
        reservationContext.extras[name] = false;
      }
      
      $("#" + extraId).prop("checked", reservationContext.extras[name]);
      
      $("#" + extraId).change(function(name) {
        reservationContext.extras[name] = this.is(':checked');
      }.bind($("#" + extraId), name));
    }

    
    
    $("#BookingConfirmation-Screen-ContactInformation-DL-Age-Checkbox").prop("checked", Backend.getTemporaryData().ageCertification);
    
    $("#BookingConfirmation-Screen-ContactInformation-DL-Age-Checkbox").change(function() {
      Backend.getTemporaryData().ageCertification = $("#BookingConfirmation-Screen-ContactInformation-DL-Age-Checkbox").is(':checked');
      this._canProceedToNextStep();
    }.bind(this));
    
    ScreenUtils.stateSelect($("#BookingConfirmation-Screen-ContactInformation-DL-License-State-Input")[0], reservationContext, "dl_state");
    
    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-ContactInformation-DL-License-Number-Input")[0], reservationContext, "dl_number", this._canProceedToNextStep.bind(this), ScreenUtils.isValidLicense);
    
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
    
    $(selector).trigger("change");
  },
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    
    var reservationComplete = true;

    var valid = Backend.getTemporaryData().ageCertification && ScreenUtils.isValidLicense(reservationContext.dl_number)
                && ScreenUtils.isValid(reservationContext.first_name) && ScreenUtils.isValid(reservationContext.last_name)
                && ScreenUtils.isValidEmail(reservationContext.email)
                && ScreenUtils.isValidPhone(reservationContext.primary_phone)
                && (reservationContext.alternative_phone == "" || ScreenUtils.isValidPhone(reservationContext.alternative_phone));

    $("#BookingConfirmation-Screen-Description-NextButton").prop("disabled", !valid);
  }
}