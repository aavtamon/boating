OwnerLogin = {
  onLoad: function() {
    $("#OwnerLogin-Screen-Login-LoginButton").prop("disabled", true);
    $("#ReservationRetrieval-Screen-Reservation-Status").html("");
    
    function reenableLoginButton() {
      var loginButtonEnabled = $("#OwnerLogin-Screen-Login-Credentials-Username-Input").val().length > 0 && $("#OwnerLogin-Screen-Login-Credentials-Password-Input").val().length > 0;
      
      $("#OwnerLogin-Screen-Login-LoginButton").prop("disabled", !loginButtonEnabled);
      $("#ReservationRetrieval-Screen-Reservation-Status").html("");
    }
    
    
    var loginInfo = {};
    
    ScreenUtils.dataModelInput($("#OwnerLogin-Screen-Login-Credentials-Username-Input")[0], loginInfo, "username", reenableLoginButton);
    ScreenUtils.dataModelInput($("#OwnerLogin-Screen-Login-Credentials-Password-Input")[0], loginInfo, "password", reenableLoginButton);
    
    $("#OwnerLogin-Screen-Login-LoginButton").click(function() {
      Backend.logIn(loginInfo.username, loginInfo.password, function(status, message) {
        if (status == Backend.STATUS_SUCCESS) {
          Main.loadScreen("owner_boat");
        } else {
          var msg = "";
          if (status == Backend.STATUS_BAD_REQUEST) {
            msg = "Something went wrong - " + message;
          } else {
            msg = "Your user name or password is not correct.<br>Please try again.";
          }
          $("#OwnerLogin-Screen-Login-Status").html(msg);
        }
      });
    });
    
    
    $("#OwnerLogin-Screen-Login-Credentials-Username-Input").focus();
  },
}