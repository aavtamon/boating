Main = {
  onLoad: function() {
    window.onhashchange = function() {
      this._loadScreen(window.location.hash.substr(1));
    }.bind(this);
    
    $(".main-menu-item").click(function(event) {
      var screen = $(event.target).attr("screen");
      window.location.hash = screen.split(" ")[0];
    });
    
    
    this.loadScreen("");
    this.loadScreen("home");
  },
  
  loadScreen: function(screen) {
    window.location.hash = screen;
  },
  
  showPopup: function(title, message) {
    $("#Main-Popup-Title").html(title);
    $("#Main-Popup-Message").html(message);
    $("#Main-Popup-Buttons").hide();
    $("#Main-Popup").show();
  },
  
  hidePopup: function() {
    $("#Main-Popup").hide();
  },
  
  showMessage: function(title, message) {
    $("#Main-Popup-Title").html(title);
    $("#Main-Popup-Message").html(message);
    $("#Main-Popup-Buttons").show();
    $("#Main-Popup").show();
  },
  
  hideMessage: function() {
    $("#Main-Popup").hide();
  },
  
  
  _loadScreen: function(screen) {
    if (this._currentScreen == screen) {
      return;
    }
    this._currentScreen = screen;
    
    $("#Main-ScreenContainer").load("screens/" + screen + ".html");
    
    
    $(".main-menu-item").css("font-weight", "normal");
    $(".main-menu-item[screen~='" + screen + "']").css("font-weight", "bold");
  }
}