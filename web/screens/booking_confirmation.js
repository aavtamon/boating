BookingConfirmation = {
  maximumCapacity: null,
  
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();

    if (reservationContext.slot == null || reservationContext.location_id == null) {
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
    
    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector", 1, this.maximumCapacity);
    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, this.maximumCapacity - 1);
    

    reservationContext.adult_count = reservationContext.adult_count || 1;
    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector")[0], reservationContext, "adult_count", function(value) {
      var remainder = this.maximumCapacity - parseInt(value);
      
      this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, remainder);
    }.bind(this));
        
    reservationContext.children_count = reservationContext.children_count || 0;
    ScreenUtils.dataModelInput($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector")[0], reservationContext, "children_count");

    $("#BookingConfirmation-Screen-ReservationSummary-Capacity-Value").html(this.maximumCapacity);
    
      
    ScreenUtils.phoneInput($("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value")[0], reservationContext, "mobile_phone", 
      this._canProceedToNextStep.bind(this), function(value) {
        return $("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value").prop("disabled") == true
               || ScreenUtils.isValidPhone(value);
      });
    
    $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").change(function(event) {
      var isDisabled = $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").is(':checked');
      $("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value").prop("disabled", isDisabled);
      
      if (isDisabled) {
        $("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value")[0].setPhone("");
      }
      
      this._canProceedToNextStep();
    }.bind(this));
    
    $("#BookingConfirmation-Screen-ReservationSummary-DateTime-Value").html(ScreenUtils.getBookingDate(reservationContext.slot.time));
    $("#BookingConfirmation-Screen-ReservationSummary-Duration-Value").html(ScreenUtils.getBookingDuration(reservationContext.slot.duration));
    
    var location = ScreenUtils.getLocation(reservationContext.location_id);
    $("#BookingConfirmation-Screen-ReservationSummary-Location-Details-PlaceName-Value").html(location.name);
    $("#BookingConfirmation-Screen-ReservationSummary-Location-Details-PlaceAddress-Value").html(location.address);
    $("#BookingConfirmation-Screen-ReservationSummary-Location-Details-ParkingFee-Value").html(location.parking_fee);
    $("#BookingConfirmation-Screen-ReservationSummary-Location-Details-PickupInstructions-Value").html(location.instructions);
    
    $("#BookingConfirmation-Screen-ReservationSummary-Price-Value").html(ScreenUtils.getBookingPrice(reservationContext.slot.price));
    
    
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

    if ($("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").is(':checked')) {
      reservationContext.no_mobile_phone = true;
    } else if (ScreenUtils.isValidPhone(reservationContext.mobile_phone)) {
      reservationContext.no_mobile_phone = false;
    } else {
      reservationComplete = false;
    }
    
    
//    reservationContext.adult_count = parseInt($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector").val());
//    reservationContext.children_count = parseInt($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector").val());
    
    
    $("#BookingConfirmation-Screen-ButtonsPanel-NextButton").prop("disabled", !reservationComplete);
  },
}