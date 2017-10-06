Main = {
  ACTION_OK: "ok",
  ACTION_CANCEL: "cancel",
  
  DIALOG_TYPE_CONFIRMATION: "confirmation",
  DIALOG_TYPE_INFORMATION: "information",
  
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
    $("#Main-Popup-Frame-Title").html(title);
    $("#Main-Popup-Frame-Message").html(message);
    $("#Main-Popup-Frame-Buttons").hide();
    $("#Main-Popup").show();
  },
  
  hidePopup: function() {
    $("#Main-Popup").hide();
  },
  
  showMessage: function(title, message, actionListener, dialogType) {
    $("#Main-Popup-Frame-Title").html(title);
    $("#Main-Popup-Frame-Message").html(message);
    $("#Main-Popup-Frame-Buttons").show();
    
    function onClick(button) {
      $("#Main-Popup").hide();
      
      if (actionListener) {
        actionListener(button);
      }
    }
    
    dialogType = dialogType || Main.DIALOG_TYPE_INFORMATION;
    
    $("#Main-Popup").show();
    
    $("#Main-Popup-Frame-Buttons-OK").show();
    $("#Main-Popup-Frame-Buttons-OK").unbind("click");
    $("#Main-Popup-Frame-Buttons-OK").click(onClick.bind(this, Main.ACTION_OK));

    if (dialogType == Main.DIALOG_TYPE_INFORMATION) {
      $("#Main-Popup-Frame-Buttons-Cancel").hide();
      $("#Main-Popup-Frame-Buttons-OK").focus();
    } else if (dialogType == Main.DIALOG_TYPE_CONFIRMATION) {
      $("#Main-Popup-Frame-Buttons-Cancel").show();
      $("#Main-Popup-Frame-Buttons-Cancel").unbind("click");
      $("#Main-Popup-Frame-Buttons-Cancel").click(onClick.bind(this, Main.ACTION_CANCEL));
      $("#Main-Popup-Frame-Buttons-Cancel").focus();
    }
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