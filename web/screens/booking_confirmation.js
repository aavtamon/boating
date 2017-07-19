BookingPayment = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date == null || reservationContext.interval == null || reservationContext.duration == null || reservationContext.location == null) {
//      Main.loadScreen("home");
    }
    
    $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").checkboxradio();
    $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector").selectmenu({width: "100px"});
    $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector").selectmenu({width: "100px"});
    
    $("#BookingPayment-Screen-ButtonsPanel-BackButton").click(function() {
      Main.loadScreen("booking_location");
    });
    
    $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").click(function() {
      Main.loadScreen("booking_confirmation");
    });

    
    var capacity = Backend.getMaximumCapacity();
    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector", 1, capacity);
    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, capacity - 1);
    
    $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector").on("selectmenuchange", function() {
      var value = $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector").val();
      var remainder = capacity - parseInt(value);
      
      this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, remainder);
    }.bind(this));    

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
    
    $(selector).selectmenu("refresh");
  },
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date != null && reservationContext.interval != null && reservationContext.duration != null) {
      $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").removeAttr("disabled");
    } else {
      $("#BookingPayment-Screen-ButtonsPanel-ConfirmButton").attr("disabled", true);
    }
  },
}