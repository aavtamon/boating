SafetyTest = {
  reservationId: null,
  reservationEmail: null,
  
  
  onLoad: function() {
    if (!this.reservationId) {
      Main.loadScreen("home");
      
      return;
    }
    
    $("#SaferyTest-Screen-SanityTestPanel").html("The tests are being retrieved");
    
    Backend.retrieveSafetyTest(function(status, tests) {
      if (status == Backend.STATUS_SUCCESS) {
        this._populateSanityTests(tests);
      } else {
        $("#SaferyTest-Screen-SanityTestPanel").html("Failed to retrieve tests");
      }
    }.bind(this));
    
    var emailData = {email: this.reservationEmail};
    
    $("#SafetyTest-Screen-TestResults-Email-SendButton").click(function() {
      Backend.resendConfirmationEmail(emailData.email, function(status) {
        if (status == Backend.STATUS_SUCCESS) {
          Main.showMessage("Confirmation email sent", "The email was sent to <b>" + emailData.email + "</b>");
        } else if (status == Backend.STATUS_NOT_FOUND) {
          Main.showMessage("Not Successful", "For some reason we don't see your reservation. Please try to pull it again.");
        } else {
          Main.showMessage("Not Successful", "An error occured. Please try again");
        }
      });
    }.bind(this));
    
    ScreenUtils.dataModelInput($("#ReservationUpdate-Screen-ReservationSummary-Email-Input")[0], emailData, "email", function(value) {
      $("#SafetyTest-Screen-TestResults-Email-SendButton").prop("disabled", !ScreenUtils.isValidEmail(value));
    }, ScreenUtils.isValidEmail);
  },
}

SaferyTest._populateSanityTests = function(tests) {
  var testsHtml = "";
  
  for (var testIndex in tests) {
    var test = tests[testIndex];
    
    var testHtml = "<div class='test-option'>";
    for (var optionIndex in test.options) {      
      var testOption = test.options[optionIndex];
      var optionId = test.id + "." + testOption.id;
      var optionHtml = "<input type='radio' id='" + optionId + "'><label for='" + optionId + "'>" + testOption.text + "</label>";
    }
    testHtml += "</div>";
  }
  
  $("#SafetyTest-Screen-SanityTestPanel").html(testHtml);
}