Main = {
  onLoad: function() {
    window.onhashchange = function() {
      this._loadScreen(window.location.hash.substr(1));
    }.bind(this);
    
    $(".main-menu-item").click(function(event) {
      var screen = $(event.target).attr("screen");
      window.location.hash = screen;
    });
    
    var screen = window.location.hash;
    if (screen == null || screen == "") {
      screen = "home";
    }
    
    if (window.location.hash = screen) {
      window.onhashchange();
    } else {
      window.location.hash = screen;
    }
  },
  
  _loadScreen: function(screen) {
    if (this._currentScreen == screen) {
      return;
    }
    this._currentScreen = screen;
    
    $("#Main-ScreenContainer").load("screens/" + screen + ".html");
    
    
    $(".main-menu-item").css("font-weight", "normal");
    $(".main-menu-item[screen=" + screen + "]").css("font-weight", "bold");
  }
}