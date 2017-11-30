SafetyTest = {
  reservationId: null,
  reservationEmail: null,
  
  _suite: {},
  
  onLoad: function() {
    if (!this.reservationId) {
      Main.loadScreen("home");
      
      return;
    }
    
    this._retrieveTestSuite();
    
    $("#SafetyTest-Screen-SafetyTestPanel-SubmitButton").click(function() {
      if ($(".test").length > $(".test-option:checked").length) {
        Main.showMessage("Please complete all tests", "You did not complete all the tests. Please go back and review them all.");
      } else {
        Backend.submitSafetyTestSuite(this._suite, function(status, checkedSuite) {
          if (status == Backend.STATUS_SUCCESS) {
            this._verifyTestResults(checkedSuite);
          } else {
            Main.showMessage("Not Successful", "An error occured. Please try again");
          }
        }.bind(this));
      }
    }.bind(this));
    
    var emailData = {email: this.reservationEmail};    
    $("#SafetyTest-Screen-TestPassed-Email-SendButton").click(function() {
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
    
    ScreenUtils.dataModelInput($("#SafetyTest-Screen-TestPassed-Email-Input")[0], emailData, "email", function(value) {
      $("#SafetyTest-Screen-TestPassed-Email-SendButton").prop("disabled", !ScreenUtils.isValidEmail(value));
    }, ScreenUtils.isValidEmail);
    
    
    $("#SafetyTest-Screen-TestFailed-RetakeButton").click(function() {
      this._retrieveTestSuite();
    }.bind(this));
  },
}

SafetyTest._populateSafetySuite = function() {
  var testsHtml = "";
  
  for (var testId in this._suite.tests) {
    var test = this._suite.tests[testId];
    
    var testHtml = "<div class='test' id='" + testId + "'><div class='test-icon'></div><div class='test-description'>" + test.text + "</div>";
    testHtml += "<div class='test-options'>";
    for (var optionId in test.options) {      
      var testOption = test.options[optionId];
      var optionHtml = "<input class='test-option' name='" + testId + "' type='radio' id='" + optionId + "'><label class='test-option-label' for='" + optionId + "'>" + testOption + "</label>";
      
      testHtml += optionHtml;
    }
    testHtml += "</div>";
    testHtml += "</div>";
    
    testsHtml += testHtml;
  }
  
  $("#SafetyTest-Screen-SafetyTestPanel-Tests").html(testsHtml);
  $(".test-option").change(function() {
    $(this).parent().parent().children(".test-icon").addClass("completed");
    
    SafetyTest._suite.tests[$(this).parent().parent().attr("id")].answer_option_id = $(this).parent().children(":checked").attr("id");
  });
}

SafetyTest._retrieveTestSuite = function() {
  $("#SafetyTest-Screen-SafetyTestPanel").show();
  $("#SafetyTest-Screen-TestPassed").hide();
  $("#SafetyTest-Screen-TestFailed").hide();

  $("#SafetyTest-Screen-SafetyTestPanel-Tests").html("The tests are being retrieved");

  Backend.retrieveSafetyTestSuite(function(status, suite) {
    if (status == Backend.STATUS_SUCCESS) {
      this._suite = suite;
      this._populateSafetySuite();
    } else {
      $("#SafetyTest-Screen-SafetyTestPanel-tests").html("Failed to retrieve tests");
    }
  }.bind(this));
}

SafetyTest._verifyTestResults = function(checkedTestResult) {
  $("#SafetyTest-Screen-SafetyTestPanel").hide();
  
  var numOfCorrectTests = 0;
  for (var id in checkedTestResult.tests) {
    if (checkedTestResult.tests[id].status) {
      numOfCorrectTests++;
    }
  }
  
  var totalNumberOfTests = Object.keys(checkedTestResult.tests).length;
  var percentage = 100 * numOfCorrectTests / totalNumberOfTests;
  
  if (percentage > 80) {
    var message = "Congratulation! You got " + numOfCorrectTests + " out of " + totalNumberOfTests + " right. This is " + percentage + "%. You passed."
    
    $("#SafetyTest-Screen-TestPassed").show();
    $("#SafetyTest-Screen-TestPassed-Score").html(message);
  } else {
    
    var message = "Unfortunately you failed the test. You got " + numOfCorrectTests + " out of " + totalNumberOfTests + " right. This is " + percentage + "%. You failed. Would you like to retake the test?";
    
    $("#SafetyTest-Screen-TestFailed").show();
    $("#SafetyTest-Screen-TestFailed-Score").html(message);
  }
}