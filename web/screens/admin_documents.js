AdminDocuments = {
  adminAccount: null,
  
  onLoad: function() {
    if (this.adminAccount == null || this.adminAccount.type != Backend.OWNER_ACCOUNT_TYPE_ADMIN) {
      Main.loadScreen("owner_login");
      return;
    }
  
    $("#AdminDocuments-Screen-Description-BackButton").click(function() {
      Main.loadScreen("admin_home");
    });
  }
}