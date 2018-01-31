SafetyTest = {
  reservationId: null,
  reservationEmail: null,
  
  _suite: {},
  
  onLoad: function() {
    if (!this.reservationId) {
      Main.loadScreen("home");
      
      return;
    }
    

    $("#SafetyTest-Screen-Description-BackButton").click(function() {
      Main.loadScreen("safety_tips");
    }.bind(this));
    
    
    this._retrieveTestSuite();
    
    
    $("#SafetyTest-Screen-SafetyTestPanel-SubmitButton").click(function() {
      if ($(".test").length > $(".test-option:checked").length) {
        Main.showMessage("Please complete all tests", "You did not complete all the questions. Please go back and review them all. A competed question has a little green circle on the left.");
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
    
    
    $("#SafetyTest-Screen-TestPassed-Email-Input").val(this.reservationEmail);
    
    $("#SafetyTest-Screen-TestFailed-RetakeButton").click(function() {
      Main.loadScreen("safety_tips");
    }.bind(this));
    
    
    ScreenUtils.form("#SafetyTest-Screen-TestPassed-Email", null, this._sendEmail);
  },
  

  _populateSafetySuite: function() {
    var testsHtml = "";

    for (var testId in this._suite.tests) {
      var test = this._suite.tests[testId];

      var optionFormat = test.options_format || "horizontal";

      var optionClass = optionFormat == "horizontal" ? "test-option-hor" : "test-option-ver";

      var testHtml = "<div class='test' id='" + testId + "'><div class='test-description'><div class='test-icon'></div>" + test.text + "</div>";
      testHtml += "<div class='test-options'>";
      for (var optionId in test.options) {
        var testOption = test.options[optionId];
        var optionHtml = "<div class='" + optionClass + "'><input class='test-option' name='" + testId + "' type='radio' id='" + optionId + "'><label class='test-option-label' for='" + optionId + "'>" + testOption + "</label></div>";

        testHtml += optionHtml;
      }
      testHtml += "</div>";
      testHtml += "</div>";

      testsHtml += testHtml;
    }

    $("#SafetyTest-Screen-SafetyTestPanel-Info-Total").html(Object.keys(this._suite.tests).length);
    $("#SafetyTest-Screen-SafetyTestPanel-Info-Correct").html(this._suite.passing_grade);

    $("#SafetyTest-Screen-SafetyTestPanel-Tests").html(testsHtml);
    $(".test").change(function() {
      $(this).find(".test-icon").addClass("completed");
      SafetyTest._suite.tests[$(this).attr("id")].answer_option_id = $(this).find(":checked").attr("id");
    });
  },
    

  _retrieveTestSuite: function() {
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
  },

  _verifyTestResults: function(checkedTestResult) {
    $("#SafetyTest-Screen-SafetyTestPanel").hide();

    var numOfCorrectTests = 0;
    for (var id in checkedTestResult.tests) {
      if (checkedTestResult.tests[id].status) {
        numOfCorrectTests++;
      }
    }

    var totalNumberOfTests = Object.keys(checkedTestResult.tests).length;
    var percentage = (100 * numOfCorrectTests / totalNumberOfTests).toFixed(2);

    if (numOfCorrectTests >= checkedTestResult.passing_grade) {
      var message = "Congratulation! You got " + numOfCorrectTests + " out of " + totalNumberOfTests + " right. This is " + percentage + "%. You passed."

      $("#SafetyTest-Screen-TestPassed").show();
      $("#SafetyTest-Screen-TestPassed-Score").html(message);
    } else {    
      var message = "Unfortunately you failed the test. You got " + numOfCorrectTests + " out of " + totalNumberOfTests + " right. This is " + percentage + "%. You failed. Would you like to re-review the safety tips and retake the test?";

      $("#SafetyTest-Screen-TestFailed").show();
      $("#SafetyTest-Screen-TestFailed-Score").html(message);
    }
  },
  
  _sendEmail: function() {
    var email = $("#SafetyTest-Screen-TestPassed-Email-Input").val();
    
    Backend.sendConfirmationEmail(email, function(status) {
      if (status == Backend.STATUS_SUCCESS) {
        Main.showMessage("Confirmation email sent", "We resent your reservation to the provided email <b>" + email + "</b><br>The email will indicate that you passed the safety training.");
      } else if (status == Backend.STATUS_NOT_FOUND) {
        Main.showMessage("Not Successful", "For some reason the email was not sent. Please try again.");
      } else {
        Main.showMessage("Not Successful", "An error occured. Please try again");
      }
    });
  }
}

