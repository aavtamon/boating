BookingPayment = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date == null || reservationContext.duration == null || reservationContext.location_id == null) {
      Main.loadScreen("home");
    }
    
    $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").checkboxradio();
    
    $("#BookingConfirmation-Screen-ButtonsPanel-BackButton").click(function() {
      Main.loadScreen("booking_location");
    });
    
    $("#BookingConfirmation-Screen-ButtonsPanel-NextButton").click(function() {
      Backend.saveReservationContext(function(status) {
        Main.loadScreen("booking_payment");
      });
    });

    
    $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector").change(function() {
      var value = $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector").val();
      var remainder = capacity - parseInt(value);
      
      this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, remainder);
    }.bind(this));
    
    var capacity = Backend.getMaximumCapacity();
    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector", 1, capacity);
    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, capacity - 1);
    
    $("#BookingConfirmation-Screen-ReservationSummary-Capacity-Value").html(capacity);
    
    
    ScreenUtils.phoneInput($("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value")[0], reservationContext.mobile_phone, function() {
      this._canProceedToNextStep();
    }.bind(this));
    
    $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").change(function(event) {
      $("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value").prop("disabled", $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").is(':checked'));
      
      this._canProceedToNextStep();
    }.bind(this));
    
    $("#BookingConfirmation-Screen-ReservationSummary-DateTime-Value").html(ScreenUtils.getBookingDate(reservationContext.date));
    $("#BookingConfirmation-Screen-ReservationSummary-Duration-Value").html(ScreenUtils.getBookingDuration(reservationContext.duration));
    
    var location = ScreenUtils.getLocation(reservationContext.location_id);
    $("#BookingConfirmation-Screen-ReservationSummary-Location-Details-PlaceName-Value").html(location.name);
    $("#BookingConfirmation-Screen-ReservationSummary-Location-Details-PlaceAddress-Value").html(location.address);
    $("#BookingConfirmation-Screen-ReservationSummary-Location-Details-ParkingFee-Value").html(location.parking_fee);
    $("#BookingConfirmation-Screen-ReservationSummary-Location-Details-PickupInstructions-Value").html(location.instructions);
    
    
    if (reservationContext.no_mobile_phone) {
      $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").attr("checked", true).change();
    }
    
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

    var phoneNumber = $("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value")[0].getPhone();
    if ($("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").is(':checked')) {
      reservationContext.mobile_phone = null;
      reservationContext.no_mobile_phone = true;
    } else if (phoneNumber.length == 10) {
      reservationContext.mobile_phone = phoneNumber;
      reservationContext.no_mobile_phone = false;
    } else {
      reservationComplete = false;
    }
    
    
    reservationContext.adult_count = parseInt($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector").val());
    reservationContext.children_count = parseInt($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector").val());
    
    
    $("#BookingConfirmation-Screen-ButtonsPanel-NextButton").prop("disabled", !reservationComplete);
  },
}