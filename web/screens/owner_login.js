OwnerLogin = {
  ownerAccount: null,
  
  
  onLoad: function() {
    if (this.ownerAccount != null) {
      if (this.ownerAccount.type == Backend.OWNER_ACCOUNT_TYPE_ADMIN) {
        Main.loadScreen("admin_home");
      } else {
        Main.loadScreen("owner_home");
      }      
      return;
    }
    
    $("#ReservationRetrieval-Screen-Reservation-Status").html("");
    $("#OwnerLogin-Screen-Login-Credentials-Username-Input").focus();
  },
  
  login: function() {
    Backend.logIn($("#OwnerLogin-Screen-Login-Credentials-Username-Input").val(), $("#OwnerLogin-Screen-Login-Credentials-Password-Input").val(), function(status, account) {
      if (status == Backend.STATUS_SUCCESS) {
        if (account.type == Backend.OWNER_ACCOUNT_TYPE_ADMIN) {
          Main.loadScreen("admin_home");
        } else {
          Main.loadScreen("owner_home");
        }
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
  }
}