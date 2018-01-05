SafetyTips = {
  reservationId: null,
  
  onLoad: function() {
    if (!this.reservationId) {
      Main.loadScreen("home");
      
      return;
    }
    
    $("#SafetyTips-Screen-Description-NextButton").click(function() {
      Main.loadScreen("safety_test");
    }.bind(this));
  }
}
