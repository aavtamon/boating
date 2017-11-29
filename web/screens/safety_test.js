SafetyTest = {
  reservationId: null,
  reservationEmail: null,
  
  
  onLoad: function() {
    if (!this.reservationId) {
      Main.loadScreen("home");
      
      return;
    }
    
    $("#SafetyTest-Screen-SafetyTestPanel").html("The tests are being retrieved");
    
    Backend.retrieveSafetyTestSuite(function(status, suite) {
      if (status == Backend.STATUS_SUCCESS) {
        this._populateSafetySuite(suite);
      } else {
        $("#SafetyTest-Screen-SafetyTestPanel").html("Failed to retrieve tests");
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
    
    ScreenUtils.dataModelInput($("#SafetyTest-Screen-TestResults-Email-Input")[0], emailData, "email", function(value) {
      $("#SafetyTest-Screen-TestResults-Email-SendButton").prop("disabled", !ScreenUtils.isValidEmail(value));
    }, ScreenUtils.isValidEmail);
  },
}

SafetyTest._populateSafetySuite = function(suite) {
  var testsHtml = "";
  
  for (var testId in suite.tests) {
    var test = suite.tests[testId];
    
    var testHtml = "<div class='test'>" + test.text;
    testHtml += "<div class='test-options'>";
    for (var optionId in test.options) {      
      var testOption = test.options[optionId];
      var fullOptionId = testId + "." + optionId;
      var optionHtml = "<input class='test-option' type='radio' id='" + fullOptionId + "'><label for='" + fullOptionId + "'>" + testOption + "</label>";
      
      testHtml += optionHtml;
    }
    testHtml += "</div>";
    testHtml += "</div>";
    
    testsHtml += testHtml;
  }
  
  $("#SafetyTest-Screen-SafetyTestPanel").html(testsHtml);
}