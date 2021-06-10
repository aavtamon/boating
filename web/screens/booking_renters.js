BookingRenters = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();

    if (Backend.isPayedReservation() || reservationContext.pickup_location_id == null) {
      Main.loadScreen("home");
      return;
    }
    

    $("#BookingRenters-Screen-Description-BackButton").click(function() {
      Main.loadScreen("booking_location");
    });
    
    $("#BookingRenters-Screen-Description-NextButton").click(function() {
      $("#BookingRenters-Screen-SubmitButton").click();
    });

    
  
    reservationContext.adult_count = reservationContext.adult_count || 1;
    reservationContext.children_count = reservationContext.children_count || 0;
    
    var boat = Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id];
    $("#BookingRenters-Screen-AdditionalInformation-NumberOfPeople-Note-Number").html(boat.maximum_capacity);
    $("#BookingRenters-Screen-AdditionalInformation-NumberOfPeople-Note-BoatName").html(boat.name);


    this._fillSelectorValues("#BookingRenters-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector", 1, boat.maximum_capacity);
    this._fillSelectorValues("#BookingRenters-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, boat.maximum_capacity - reservationContext.adult_count);
        
    ScreenUtils.dataModelInput("#BookingRenters-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector", reservationContext, "adult_count", function(value) {
      var remainder = boat.maximum_capacity - value;
      
      this._fillSelectorValues("#BookingRenters-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, remainder);
    }.bind(this), null, function(value) {
      return parseInt(value);
    });
        
    ScreenUtils.dataModelInput("#BookingRenters-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", reservationContext, "children_count", null, null, function(value) {
      return parseInt(value);
    });
    
    
    if (reservationContext.extras == null) {
      reservationContext.extras = {};
    }
    
    var extras = Backend.getBookingConfiguration().locations[reservationContext.location_id].extras;
    for (var name in extras) {
      var extra = extras[name];
      var extraId = "BookingRenters-Screen-AdditionalInformation-Equipment-Extras-" + name;
      $("#BookingRenters-Screen-AdditionalInformation-Equipment-Extras").append('<div id="' + extraId + '-container" class="extras-container"></div>');
      $("#" + extraId + "-container").append('<input id="' + extraId + '"/>');
      $("#" + extraId + "-container").append('<label for="' + extraId + '">' + extra.name + ' (+' + ScreenUtils.getBookingPrice(extra.price) + ')</label>');
      
      for (var index in extra.images) {
        $("#" + extraId + "-container").append('<a href=' + extra.images[index].url + ' target="_blank"><img class="extras-thumbnail" src=' + extra.images[index].url + '></img></a>');
      }
      
      ScreenUtils.checkbox("#" + extraId, reservationContext.extras, name);
    }

    
    
    ScreenUtils.checkbox("#BookingRenters-Screen-ContactInformation-DL-Age-Checkbox", Backend.getTemporaryData(), "age_certification");
    ScreenUtils.stateSelect("#BookingRenters-Screen-ContactInformation-DL-License-State-Input", reservationContext, "dl_state");
    ScreenUtils.dataModelInput("#BookingRenters-Screen-ContactInformation-DL-License-Number-Input", reservationContext, "dl_number");
    ScreenUtils.dataModelInput("#BookingRenters-Screen-ContactInformation-Name-FirstName-Input", reservationContext, "first_name");
    ScreenUtils.dataModelInput("#BookingRenters-Screen-ContactInformation-Name-LastName-Input", reservationContext, "last_name");
    ScreenUtils.dataModelInput("#BookingRenters-Screen-ContactInformation-Email-Input", reservationContext, "email");
    ScreenUtils.dataModelInput("#BookingRenters-Screen-ContactInformation-Phone-PrimaryPhone-Input", reservationContext, "primary_phone");
    ScreenUtils.dataModelInput("#BookingRenters-Screen-ContactInformation-Phone-AlternativePhone-Input", reservationContext, "alternative_phone");
    
    
    ScreenUtils.form("#BookingRenters-Screen",
                     {"id-number": {minlength: 7, maxlength: 15},
                      "phone": {phoneUS: true},
                      "alternative-phone": {phoneUS: true}
                     },
                     function() {
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
