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
      $("#BookingConfirmation-Screen-SubmitButton").click();
    });

    
  
    reservationContext.adult_count = reservationContext.adult_count || 1;
    reservationContext.children_count = reservationContext.children_count || 0;
    
    var boat = Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id];
    $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Note-Number").html(boat.maximum_capacity);
    $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Note-BoatName").html(boat.name);


    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector", 1, boat.maximum_capacity);
    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, boat.maximum_capacity - reservationContext.adult_count);
        
    ScreenUtils.dataModelInput("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector", reservationContext, "adult_count", function(value) {
      var remainder = boat.maximum_capacity - value;
      
      this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, remainder);
    }.bind(this), null, function(value) {
      return parseInt(value);
    });
        
    ScreenUtils.dataModelInput("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", reservationContext, "children_count", null, null, function(value) {
      return parseInt(value);
    });
    
    
    if (reservationContext.extras == null) {
      reservationContext.extras = {};
    }
    
    var extras = Backend.getBookingConfiguration().locations[reservationContext.location_id].extras;
    for (var name in extras) {
      var extra = extras[name];
      var extraId = "BookingConfirmation-Screen-AdditionalInformation-Equipment-Extras-" + name;
      $("#BookingConfirmation-Screen-AdditionalInformation-Equipment-Extras").append('<input id="' + extraId + '"/>');
      $("#BookingConfirmation-Screen-AdditionalInformation-Equipment-Extras").append('<label for="' + extraId + '">' + extra.name + ' (+$' + extra.price + ')</label>');
      
      ScreenUtils.checkbox("#" + extraId, reservationContext.extras, name);
    }

    
    
    ScreenUtils.checkbox("#BookingConfirmation-Screen-ContactInformation-DL-Age-Checkbox", Backend.getTemporaryData(), "age_certification");
    ScreenUtils.stateSelect("#BookingConfirmation-Screen-ContactInformation-DL-License-State-Input", reservationContext, "dl_state");
    ScreenUtils.dataModelInput("#BookingConfirmation-Screen-ContactInformation-DL-License-Number-Input", reservationContext, "dl_number");
    ScreenUtils.dataModelInput("#BookingConfirmation-Screen-ContactInformation-Name-FirstName-Input", reservationContext, "first_name");
    ScreenUtils.dataModelInput("#BookingConfirmation-Screen-ContactInformation-Name-LastName-Input", reservationContext, "last_name");
    ScreenUtils.dataModelInput("#BookingConfirmation-Screen-ContactInformation-Email-Input", reservationContext, "email");
    ScreenUtils.dataModelInput("#BookingConfirmation-Screen-ContactInformation-Phone-PrimaryPhone-Input", reservationContext, "primary_phone");
    ScreenUtils.dataModelInput("#BookingConfirmation-Screen-ContactInformation-Phone-AlternativePhone-Input", reservationContext, "alternative_phone");
    
    
    ScreenUtils.form("#BookingConfirmation-Screen", {"id-number": {minlength: 7, maxlength: 15}}, function() {
      Main.loadScreen("booking_payment");
    });
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
}