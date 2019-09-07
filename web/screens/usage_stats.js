UsageStats = {
  ownerAccount: null,
  
  onLoad: function() {
    if (this.ownerAccount == null) {
      Main.loadScreen("owner_login");
      return;
    }
  
    $("#UsageStats-Screen-Description-BackButton").click(function() {
      history.back();
      //Main.loadScreen("admin_home");
    });
  }
}