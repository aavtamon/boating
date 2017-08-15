BookingPayment = {
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    if (reservationContext.date == null || reservationContext.duration == null || reservationContext.location_id == null) {
      Main.loadScreen("home");
    }
    
    this._phoneNumber = reservationContext.phone || "";      
    

    $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").checkboxradio();
    $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector").selectmenu({width: "100px"});
    $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector").selectmenu({width: "100px"});
    
    $("#BookingConfirmation-Screen-ButtonsPanel-BackButton").click(function() {
      Main.loadScreen("booking_location");
    });
    
    $("#BookingConfirmation-Screen-ButtonsPanel-NextButton").click(function() {
      Backend.saveReservationContext(function(status) {
        Main.loadScreen("booking_payment");
      });
    });

    
    $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector").on("selectmenuchange", function() {
      var value = $("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector").val();
      var remainder = capacity - parseInt(value);
      
      this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, remainder);
    }.bind(this));
    
    var capacity = Backend.getMaximumCapacity();
    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector", 1, capacity);
    this._fillSelectorValues("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector", 0, capacity - 1);
    
    $("#BookingConfirmation-Screen-ReservationSummary-Capacity-Value").html(capacity);
    
    
    $("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value").keydown(function(event) {
      event.preventDefault();
      
      if (event.which >= 48 && event.which <= 57) {
        if (this._phoneNumber.length < 10) {
          this._phoneNumber += "" + (event.which - 48);
          
          if (this._phoneNumber.length == 10) {
            this._canProceedToNextStep();
          }
        }
      } else if (event.which == 8) {
        if (this._phoneNumber.length > 0) {
          this._phoneNumber = this._phoneNumber.substring(0, this._phoneNumber.length - 1);
        }
        if (this._phoneNumber.length == 9) {
          this._canProceedToNextStep();
        }
      } else {
        return false;
      }
      
      $("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value").val(ScreenUtils.formatPhoneNumber(this._phoneNumber));
    }.bind(this));
    
    $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").change(function(event) {
      $("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value").prop("disabled", $("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").is(':checked'));
      
      this._canProceedToNextStep();
    }.bind(this));
    
    $("#BookingConfirmation-Screen-AdditionalInformation-Phone-Value").val(ScreenUtils.formatPhoneNumber(""));
    
    
    var location = null;
    var locations = Backend.getLocations();
    for (var i in locations) {
      location = locations[i];
      if (location.id == reservationContext.location_id) {
        break;
      }
    }
    
    $("#BookingConfirmation-Screen-ReservationSummary-DateTime-Value").html(ScreenUtils.getBookingDate(reservationContext.date));
    $("#BookingConfirmation-Screen-ReservationSummary-Duration-Value").html(ScreenUtils.getBookingDuration(reservationContext.duration));
    $("#BookingConfirmation-Screen-ReservationSummary-Location-Details-PlaceName-Value").html(location.name);
    $("#BookingConfirmation-Screen-ReservationSummary-Location-Details-PlaceAddress-Value").html(location.address);
    $("#BookingConfirmation-Screen-ReservationSummary-Location-Details-ParkingFee-Value").html(location.parking_fee);
    $("#BookingConfirmation-Screen-ReservationSummary-Location-Details-PickupInstructions-Value").html(location.instructions);
    
    
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
    
    var reservationComplete = true;
    if ($("#BookingConfirmation-Screen-AdditionalInformation-Phone-DoNotProvide-Checkbox").is(':checked')) {
      reservationContext.phone = "";
    } else if (this._phoneNumber.length == 10) {
      reservationContext.phone = this._phoneNumber;
    } else {
      reservationComplete = false;
    }
    
    
    reservationContext.adult_count = parseInt($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Adults-Selector").val());
    reservationContext.children_count = parseInt($("#BookingConfirmation-Screen-AdditionalInformation-NumberOfPeople-Children-Selector").val());
    
    
    $("#BookingConfirmation-Screen-ButtonsPanel-NextButton").prop("disabled", !reservationComplete);
  },
}