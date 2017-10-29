BookingPayment = {
  maximumCapacity: null,
  cancellationFees: null,
  _cancellationPolicyAccepted: false,
  
  
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    
    if (Backend.isPayedReservation() || reservationContext.slot == null || reservationContext.location_id == null || reservationContext.adult_count == null || reservationContext.children_count == null) {
      Main.loadScreen("home");
      
      return;
    }
    
    $("#BookingPayment-Screen-Description-BackButton").click(function() {
      Main.loadScreen("booking_confirmation");
    });
    
    
    if (Backend.getTemporaryData().paymentInfo == null) {
      Backend.getTemporaryData().paymentInfo = {card_ready: false, name: reservationContext.first_name + " " + reservationContext.last_name};
    }
    var paymentInfo = Backend.getTemporaryData().paymentInfo;
    paymentInfo.card_ready = false;
    
    
    var stripe = Stripe('pk_test_39gZjXaJ3YlMgPhFcISoz2MC');    
    var elements = stripe.elements();
    
    var style = {
      base: {
        color: '#32325d',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    };
    
    var card = elements.create("card", {style: style});
    card.mount("#BookingPayment-Screen-PaymentInformation-CreditCard-Input");
    
    card.addEventListener("change", function(event) {
      $("#BookingPayment-Screen-PaymentInformation-CreditCard-Status").html("");
      
      if (event.error) {
        $("#BookingPayment-Screen-PaymentInformation-CreditCard-Status").html(event.error.message);
      }
      
      paymentInfo.card_ready = event.complete;
      this._canProceedToNextStep();
    }.bind(this));
    
    
    
    $("#BookingPayment-Screen-Description-ConfirmButton").click(function() {
      if (this._cancellationPolicyAccepted) {
        this._pay();
      } else {
        Main.showMessage("Please review our cancellation policy", this._getCancellationPolicy(), function(action) {
          if (action == Main.ACTION_OK) {
            this._cancellationPolicyAccepted = true;
            this._pay();
          }
        }.bind(this), Main.DIALOG_TYPE_CONFIRMATION);
      }
    }.bind(this));
    

    $("#BookingPayment-Screen-ReservationSummary-DateTime-Value").html(ScreenUtils.getBookingDate(reservationContext.slot.time) + " " + ScreenUtils.getBookingTime(reservationContext.slot.time));
    $("#BookingPayment-Screen-ReservationSummary-Duration-Value").html(ScreenUtils.getBookingDuration(reservationContext.slot.duration));
    
    $("#BookingPayment-Screen-ReservationSummary-Capacity-Value").html(this.maximumCapacity);

    var location = ScreenUtils.getLocation(reservationContext.location_id);
    $("#BookingPayment-Screen-ReservationSummary-Location-Details-PlaceName-Value").html(location.name);
    $("#BookingPayment-Screen-ReservationSummary-Location-Details-PlaceAddress-Value").html(location.address);
    $("#BookingPayment-Screen-ReservationSummary-Location-Details-ParkingFee-Value").html(location.parking_fee);
    $("#BookingPayment-Screen-ReservationSummary-Location-Details-PickupInstructions-Value").html(location.instructions);    
    $("#BookingPayment-Screen-ReservationSummary-Price-Value").html(ScreenUtils.getBookingPrice(reservationContext.slot.price));
    
    
    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Name-Input")[0], paymentInfo, "name", this._canProceedToNextStep.bind(this));

    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Address-Street-Input")[0], paymentInfo, "street_address", this._canProceedToNextStep.bind(this));

    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Address-Additional-Input")[0], paymentInfo, "additional_address", this._canProceedToNextStep.bind(this));
    
    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Area-City-Input")[0], paymentInfo, "city", this._canProceedToNextStep.bind(this));

    ScreenUtils.dataModelInput($("#BookingPayment-Screen-PaymentInformation-Area-State-Input")[0], paymentInfo, "state", this._canProceedToNextStep.bind(this));
    
    
    $("#BookingPayment-Screen-CancellationPolicy-Link").attr("href", "javascript:BookingPayment._showCancellationPolicy()");
    
    this._canProceedToNextStep();
  },
  
  
  _pay: function() {
    Main.showPopup("Payment Processing", "Your payment is being processed.<br>Do not refresh or close your browser");

    var cardData = {
      name: paymentInfo.name,
      address_line1: paymentInfo.street_address,
      address_line2: paymentInfo.additional_address,
      address_city: paymentInfo.city,
      address_state: paymentInfo.state,
      address_country: "US",
      currency: "usd"
    }

    stripe.createToken(card, cardData).then(function(result) {
      if (result.error) {
        Main.showMessage("Payment Not Successful", result.error.message);
      } else {
        Backend.saveReservation(function(status) {
          if (status == Backend.STATUS_SUCCESS) {
            Backend.pay(result.token.id, function(status) {
              Main.hidePopup();
              if (status == Backend.STATUS_SUCCESS) {
                Backend.getTemporaryData().paymentInfo = null;

                Main.loadScreen("booking_complete");
              } else if (status == Backend.STATUS_BAD_REQUEST) {
                Main.showMessage("Payment Not Successful", "Your payment did not get thru. Please check your payment details.");
              } else {
                Main.showMessage("Payment Not Successful", "Something went wrong. Please try again");
              }
            });
          } else if (status == Backend.STATUS_NOT_FOUND) {
            Main.showMessage("Not Successful", "We cannot save your reservation. Try again later");
          } else if (status == Backend.STATUS_CONFLICT) {
            Main.showMessage("Not Successful", "We are sorry, but it looks like this time was just booked. Please choose another one");
          } else {
            Main.showMessage("Not Successful", "An error occured. Please try again");
          }

          //TODO: Consider removing of the previous;y saved reservation
        });
      }
    });    
  },
 
  
  _getCancellationPolicy: function() {
    var policy = "<center><h1>Cancellation Policy</h1></center><p>We allow free cancellation " + BookingPayment.cancellationFees[0].range_max + " hours or more prior to your planned departure.<br>If you cancel in less than " + BookingPayment.cancellationFees[0].range_max + " hours, the following fees apply:<br><ul>";
    
    
    for (var index in BookingPayment.cancellationFees) {
      var fee = BookingPayment.cancellationFees[index];
      policy += "<li>" + fee.range_min + " - " + fee.range_max + " hours: $" + fee.price + " dollars</li>"
    }
    
    return policy;
  },
  
  _showCancellationPolicy: function() {
    Main.showMessage("Cancellation Policy", this._getCancellationPolicy());
  },
  
  
  _canProceedToNextStep: function() {
    var reservationContext = Backend.getReservationContext();
    var paymentInfo = Backend.getTemporaryData().paymentInfo;
        
    var valid = ScreenUtils.isValid(paymentInfo.name) && ScreenUtils.isValid(paymentInfo.street_address) && ScreenUtils.isValid(paymentInfo.city) && (paymentInfo.card_ready == true);
         
    $("#BookingPayment-Screen-Description-ConfirmButton").prop("disabled", !valid);
  },
}