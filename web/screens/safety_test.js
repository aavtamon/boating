SafetyTest = {
  reservation: null,
  safetyTestResults: null,
  
  _testResult: {},
  
  onLoad: function() {
    if (!this.reservation) {
      Main.loadScreen("home");
      
      return;
    }
    

    $("#SafetyTest-Screen-Description-BackButton").click(function() {
      Main.loadScreen("safety_tips");
    }.bind(this));
    
    
    var foundResultForPrimaryRenter = false;
    for (var dlId in this.safetyTestResults) {
      var testResult = this.safetyTestResults[dlId];
      if (testResult.dl_state == this.reservation.dl_state && testResult.dl_number == this.reservation.dl_number) {
        foundResultForPrimaryRenter = true;
        break;
      }
    }
    if (!foundResultForPrimaryRenter) {
      Backend.getTemporaryData().dl_state = this.reservation.dl_state;
      Backend.getTemporaryData().dl_number = this.reservation.dl_number;
      Backend.getTemporaryData().first_name = this.reservation.first_name;
      Backend.getTemporaryData().last_name = this.reservation.last_name;
    }
    
    ScreenUtils.stateSelect("#SafetyTest-Screen-SafetyTestPanel-DriverInfo-DL-State-Input", Backend.getTemporaryData(), "dl_state");
    ScreenUtils.dataModelInput("#SafetyTest-Screen-SafetyTestPanel-DriverInfo-DL-Number-Input", Backend.getTemporaryData(), "dl_number");
    ScreenUtils.dataModelInput("#SafetyTest-Screen-SafetyTestPanel-DriverInfo-FirstName-Input", Backend.getTemporaryData(), "first_name");
    ScreenUtils.dataModelInput("#SafetyTest-Screen-SafetyTestPanel-DriverInfo-LastName-Input", Backend.getTemporaryData(), "last_name");
    
    $("#SafetyTest-Screen-TestPassed").hide();
    $("#SafetyTest-Screen-TestFailed").hide();
    
    this._retrieveTestSuite();
    
    
    ScreenUtils.form("#SafetyTest-Screen-SafetyTestPanel",
                     {"id-number": {minlength: 7, maxlength: 15}},
                     function() {
      if ($(".test").length > $(".test-option:checked").length) {
        Main.showMessage("Please complete all tests", "You did not complete all the questions. Please go back and review them all. A competed question has a little green circle on the left.");
      } else {
        this._testResult.first_name = Backend.getTemporaryData().first_name;
        this._testResult.last_name = Backend.getTemporaryData().last_name;
        this._testResult.dl_state = Backend.getTemporaryData().dl_state;
        this._testResult.dl_number = Backend.getTemporaryData().dl_number;
        
        Main.showPopup("Submitting...", '<center>Your test results are being processed.<br>Do not refresh or close your browser.</center>');
        
        Backend.submitSafetyTestSuite(this._testResult, function(status, checkedSuite) {
          Main.hidePopup();
          if (status == Backend.STATUS_SUCCESS) {
            this._verifyTestResults(checkedSuite);
          } else {
            Main.showMessage("Not Successful", "An error occured. Please try again");
          }
        }.bind(this));
      }
    }.bind(this));
    
    
    $("#SafetyTest-Screen-TestFailed-RetakeButton").click(function() {
      Main.loadScreen("safety_tips");
    }.bind(this));
    
    
    ScreenUtils.form("#SafetyTest-Screen-TestPassed", null, this._sendEmail);
  },
  

  _populateSafetySuite: function() {
    var testsHtml = "";

    for (var testId in this._testResult.safety_suite.tests) {
      var test = this._testResult.safety_suite.tests[testId];

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

    $("#SafetyTest-Screen-SafetyTestPanel-Info-Total").html(Object.keys(this._testResult.safety_suite.tests).length);
    $("#SafetyTest-Screen-SafetyTestPanel-Info-Correct").html(this._testResult.safety_suite.passing_grade);

    $("#SafetyTest-Screen-SafetyTestPanel-Tests").html(testsHtml);
    $(".test").change(function() {
      $(this).find(".test-icon").addClass("completed");
      SafetyTest._testResult.safety_suite.tests[$(this).attr("id")].answer_option_id = $(this).find(":checked").attr("id");
    });
  },
    

  _retrieveTestSuite: function() {
    $("#SafetyTest-Screen-SafetyTestPanel-Tests").html("The tests are being retrieved");

    Backend.retrieveSafetyTestSuite(function(status, suite) {
      if (status == Backend.STATUS_SUCCESS) {
        this._testResult.safety_suite = suite;
        this._populateSafetySuite();
      } else {
        $("#SafetyTest-Screen-SafetyTestPanel-Tests").html("Failed to retrieve tests");
      }
    }.bind(this));
  },

  _verifyTestResults: function(checkedTestResult) {
    $("#SafetyTest-Screen-SafetyTestPanel").hide();

    var numOfCorrectTests = 0;
    for (var id in checkedTestResult.safety_suite.tests) {
      if (checkedTestResult.safety_suite.tests[id].status) {
        numOfCorrectTests++;
      }
    }

    var totalNumberOfTests = Object.keys(checkedTestResult.safety_suite.tests).length;
    var percentage = (100 * numOfCorrectTests / totalNumberOfTests).toFixed(2);

    if (numOfCorrectTests >= checkedTestResult.safety_suite.passing_grade) {
      var message = "Congratulation " + checkedTestResult.first_name + "! You got " + numOfCorrectTests + " out of " + totalNumberOfTests + " right. This is " + percentage + "%. You passed."

      $("#SafetyTest-Screen-TestPassed").show();
      $("#SafetyTest-Screen-TestPassed-Score").html(message);
    } else {    
      var message = "Unfortunately you failed the test, " + checkedTestResult.first_name + ". You got " + numOfCorrectTests + " out of " + totalNumberOfTests + " right. This is " + percentage + "%. You failed.<br>Would you like to re-review safety tips and retake the test?";

      $("#SafetyTest-Screen-TestFailed").show();
      $("#SafetyTest-Screen-TestFailed-Score").html(message);
    }
  },
  
  _sendEmail: function() {
    var email = $("#SafetyTest-Screen-TestPassed-Email-Input").val();

    Backend.emailSafetyTestResults(email, Backend.getTemporaryData().dl_state, Backend.getTemporaryData().dl_number, function(status) {
      if (status == Backend.STATUS_SUCCESS) {
        Main.showMessage("Test results are sent", "We sent you the test results to the provided email <b>" + email + "</b><br>The email will indicate that you passed the safety training.");
      } else if (status == Backend.STATUS_NOT_FOUND) {
        Main.showMessage("Not Successful", "For some reason the email was not sent. Please try again.");
      } else {
        Main.showMessage("Not Successful", "An error occured. Please try again");
      }
    });
  }
}

