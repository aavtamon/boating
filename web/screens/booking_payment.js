BookingPayment = {
  _cancellationPolicyAccepted: false,
  _promoDiscount: null,
  
  
  onLoad: function() {
    var reservationContext = Backend.getReservationContext();
    
    if (Backend.isPayedReservation() || reservationContext.adult_count == null || reservationContext.children_count == null) {
      Main.loadScreen("home");
      
      return;
    }
    
    $("#BookingPayment-Screen-Description-BackButton").click(function() {
      Main.loadScreen("booking_renters");
    });
    
    $("#BookingPayment-Screen-Description-ConfirmButton").click(function() {
      if (Backend.getTemporaryData().paymentInfo.card_ready) {
        $("#BookingPayment-Screen-SubmitButton").click();
      } else {
        $("#BookingPayment-Screen-PaymentInformation-CreditCard-Status").html("Please provide credit card information.");
      }
    });
    
        
    if (Backend.getTemporaryData().paymentInfo == null) {
      Backend.getTemporaryData().paymentInfo = {card_ready: false, name: reservationContext.first_name + " " + reservationContext.last_name};
    }
    var paymentInfo = Backend.getTemporaryData().paymentInfo;
    paymentInfo.card_ready = false;
    
    
    var stripe = Stripe(Backend.PAYMENT_KEY);    
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
      
      Backend.getTemporaryData().paymentInfo.card_ready = event.complete;
    }.bind(this));
    
    
    
    $("#BookingPayment-Screen-ReservationSummary-DateTime-Value").html(ScreenUtils.getBookingDate(reservationContext.slot.time) + " " + ScreenUtils.getBookingTime(reservationContext.slot.time));
    $("#BookingPayment-Screen-ReservationSummary-Duration-Value").html(ScreenUtils.getBookingDuration(reservationContext.slot.duration));

    var boat = Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id];
    $("#BookingPayment-Screen-ReservationSummary-Boat-Value").html(boat.name);
  
    $("#BookingPayment-Screen-ReservationSummary-Group-Value").html(reservationContext.adult_count + " adults and " + reservationContext.children_count + " children (allowed maximum - " + Backend.getBookingConfiguration().locations[reservationContext.location_id].boats[reservationContext.boat_id].maximum_capacity + ")");
    
    
    var location = Backend.getBookingConfiguration().locations[reservationContext.location_id].pickup_locations[reservationContext.pickup_location_id];
    $("#BookingPayment-Screen-ReservationSummary-Location-Details-PlaceName-Value").html(location.name);
    $("#BookingPayment-Screen-ReservationSummary-Location-Details-PlaceAddress-Value").html(location.address);
    $("#BookingPayment-Screen-ReservationSummary-Location-Details-ParkingFee-Value").html(location.parking_fee);
    $("#BookingPayment-Screen-ReservationSummary-Location-Details-PickupInstructions-Value").html(location.instructions);    
    
    var includedExtrasAndPrice = ScreenUtils.getBookingExtrasAndPrice(reservationContext.extras, Backend.getBookingConfiguration().locations[reservationContext.location_id].extras);
        $("#BookingPayment-Screen-ReservationSummary-Extras-Value").html(includedExtrasAndPrice[0] == "" ? "none" : includedExtrasAndPrice[0]);
    
    this._updateTotalPrice();
    
    ScreenUtils.dataModelInput("#BookingPayment-Screen-ReservationSummary-PromoCode-Input", reservationContext, "promo_code");
    
    
    var applyPromoCode = function() {
      promoCode = $("#BookingPayment-Screen-ReservationSummary-PromoCode-Input").val();
      if (promoCode == "") {
        this._promoDiscount = null;
        $("#BookingPayment-Screen-ReservationSummary-PromoCode-Status").html("");
        this._updateTotalPrice();
      } else {
        Backend.getPromoCode($("#BookingPayment-Screen-ReservationSummary-PromoCode-Input").val(), function(status, discount) {
          if (status == Backend.STATUS_SUCCESS) {
            this._promoDiscount = discount;
            $("#BookingPayment-Screen-ReservationSummary-PromoCode-Status").html("");
          } else {
            this._promoDiscount = null;
            $("#BookingPayment-Screen-ReservationSummary-PromoCode-Status").html("Promo code not found");
          }
          this._updateTotalPrice();
        }.bind(this));
      }
    }.bind(this);
    
    $("#BookingPayment-Screen-ReservationSummary-PromoCode-ApplyButton").click(function() {
      applyPromoCode();
    });
    
    if ($("#BookingPayment-Screen-ReservationSummary-PromoCode-Input").val() != null) {
      applyPromoCode();
    }

    
    
    
    
    ScreenUtils.dataModelInput("#BookingPayment-Screen-PaymentInformation-Name-Input", paymentInfo, "name");
    ScreenUtils.dataModelInput("#BookingPayment-Screen-PaymentInformation-Address-Street-Input", paymentInfo, "street_address");
    ScreenUtils.dataModelInput("#BookingPayment-Screen-PaymentInformation-Address-Additional-Input", paymentInfo, "additional_address");
    ScreenUtils.dataModelInput("#BookingPayment-Screen-PaymentInformation-Area-City-Input", paymentInfo, "city");
    ScreenUtils.stateSelect("#BookingPayment-Screen-PaymentInformation-Area-State-Input", paymentInfo, "state");
    
    
    $("#BookingPayment-Screen-CancellationPolicy-Link").attr("href", "javascript:BookingPayment._showCancellationPolicy()");
    
    
    ScreenUtils.form("#BookingPayment-Screen", null, function() {
      if (this._cancellationPolicyAccepted) {
        this._pay(stripe, card);
      } else {
        Main.showMessage("Important Policy Information", "<div id='BookingPayment-TermsAndServces'></div><br><div style='font-size: 16px;'>Press <b>OK</b> to agree and proceed with the reservaion.<br>Press <b>Cancel</b> if you disagree with this policy, and your reservation will not be processed.</div>", function(action) {
          if (action == Main.ACTION_OK) {
            this._cancellationPolicyAccepted = true;
            this._pay(stripe, card);
          }
        }.bind(this), Main.DIALOG_TYPE_CONFIRMATION);
        
        $("#BookingPayment-TermsAndServces").load("files/docs/terms-and-services.html");
      }
    }.bind(this));
  },
  
  
  _updateTotalPrice: function() {
    var reservationContext = Backend.getReservationContext();
    var includedExtrasAndPrice = ScreenUtils.getBookingExtrasAndPrice(reservationContext.extras, Backend.getBookingConfiguration().locations[reservationContext.location_id].extras);
    
    var discount = 0;
    var totalPrice = reservationContext.slot.price + includedExtrasAndPrice[1];
    if (this._promoDiscount != null && this._promoDiscount > 0) {
      discount = Math.round(totalPrice * this._promoDiscount / 100);
      totalPrice = totalPrice - discount;
    }
    
    var detailsIncluded = false;
    var totalPriceString = ScreenUtils.getBookingPrice(totalPrice);
    if (includedExtrasAndPrice[1] != "" || this._promoDiscount != null && this._promoDiscount > 0) {
      detailsIncluded = true;
      totalPriceString += "&nbsp;&nbsp;&nbsp;<font style='font-weight: normal;'>[" + ScreenUtils.getBookingPrice(reservationContext.slot.price) + " boat";
    }
    if (includedExtrasAndPrice[1] != "") {
      totalPriceString += " + " + ScreenUtils.getBookingPrice(includedExtrasAndPrice[1]) + " equipment";
    }
    if (this._promoDiscount != null && this._promoDiscount > 0) {
      totalPriceString += " - " + ScreenUtils.getBookingPrice(discount) + " discount";
    }
    if (detailsIncluded) {
      totalPriceString += "]</font>";
    }
    
    $("#BookingPayment-Screen-ReservationSummary-Price-Value").html(totalPriceString);    
  },
  
  
  _pay: function(stripe, card) {
    Main.showPopup("Payment Processing", '<center>Your payment is being processed.<br>Do not refresh or close your browser.</center>');

    var paymentInfo = Backend.getTemporaryData().paymentInfo;
    
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
        Backend.saveReservation(function(status, reservationId) {
          if (status == Backend.STATUS_SUCCESS) {
            Backend.payReservation(result.token.id, function(status) {
              Main.hidePopup();
              if (status == Backend.STATUS_SUCCESS) {
                Backend.getTemporaryData().paymentInfo = null;

                Main.loadScreen("booking_complete?id=" + reservationId);
              } else if (status == Backend.STATUS_BAD_REQUEST) {
                Main.showMessage("Payment Not Successful", "Your payment did not get thru. Please check your payment details.");
              } else {
                Main.showMessage("Payment Not Successful", "Something went wrong. Please try again");
              }

              //TODO: Consider removing of the previously saved reservation
            });
          } else if (status == Backend.STATUS_NOT_FOUND) {
            Main.showMessage("Not Successful", "We cannot save your reservation. Try again later");
          } else if (status == Backend.STATUS_CONFLICT) {
            Main.showMessage("Not Successful", "We are sorry, but it looks like this time was just booked. Please choose another one");
          } else {
            Main.showMessage("Not Successful", "An error occured. Please try again");
          }
        });
      }
    });    
  },
 
  
  _showCancellationPolicy: function() {
    Main.showMessage("Important Policy Information", "<div id='BookingPayment-TermsAndServces'></div>");
    $("#BookingPayment-TermsAndServces").load("files/docs/terms-and-services.html");
  },
}