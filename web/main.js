Main = {
  ACTION_OK: "ok",
  ACTION_CANCEL: "cancel",
  
  DIALOG_TYPE_CONFIRMATION: "confirmation",
  DIALOG_TYPE_YESNO: "yesno",
  DIALOG_TYPE_INFORMATION: "information",
  
  _storeElements: [],
  
  onLoad: function() {
    window.onhashchange = function() {
      this.hidePopup();

      this._loadScreen(window.location.hash.substr(1));
    }.bind(this);
    
    $(".main-menu-item").click(function(event) {
      var screen = $(event.target).attr("screen");
      window.location.hash = screen.split(" ")[0];
    });
    
    
    
    // Special handling
    var requestedPath = window.location.hash != null && window.location.hash.length > 0 ? window.location.hash.substr(1) : "";
    var requestedScreen = requestedPath.split('?')[0];
    
    if (requestedScreen != "reservation_retrieval") {
      requestedScreen = null;
    }

    this.loadScreen("");
    if (requestedScreen == null) {
      this.loadScreen("home");
    } else {
      this.loadScreen(requestedPath);
    }
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
    
    if (dialogType == Main.DIALOG_TYPE_YESNO) {
      $("#Main-Popup-Frame-Buttons-OK").html("Yes");
      $("#Main-Popup-Frame-Buttons-Cancel").html("No");
    } else {
      $("#Main-Popup-Frame-Buttons-OK").html("OK");
      $("#Main-Popup-Frame-Buttons-Cancel").html("Cancel");
    }
    
    $("#Main-Popup-Frame-Buttons-OK").show();
    $("#Main-Popup-Frame-Buttons-OK").unbind("click");
    $("#Main-Popup-Frame-Buttons-OK").click(onClick.bind(this, Main.ACTION_OK));

    if (dialogType == Main.DIALOG_TYPE_INFORMATION) {
      $("#Main-Popup-Frame-Buttons-Cancel").hide();
      $("#Main-Popup-Frame-Buttons-OK").focus();
    } else if (dialogType == Main.DIALOG_TYPE_CONFIRMATION || dialogType == Main.DIALOG_TYPE_YESNO) {
      $("#Main-Popup-Frame-Buttons-Cancel").show();
      $("#Main-Popup-Frame-Buttons-Cancel").unbind("click");
      $("#Main-Popup-Frame-Buttons-Cancel").click(onClick.bind(this, Main.ACTION_CANCEL));
      $("#Main-Popup-Frame-Buttons-Cancel").focus();
    }
  },
  
  hideMessage: function() {
    $("#Main-Popup").hide();
  },
  
  
  storeElement: function(tag, element) {
    element.setAttribute("id", tag);
    this._storeElements.push(element);
  },
  
  recoverElement: function(tag) {
    var element = $("#Main-RecycleBin #" + tag);
    if (element.length == 1) {
      return element[0];
    }
    
    return null;
  },
  
  
  _loadScreen: function(requestedPath) {
    var screen = requestedPath.split('?')[0];
    
    if (this._currentScreen == screen) {
      return;
    }
    
    for (var index in this._storeElements) {
      $("#Main-RecycleBin").append(this._storeElements[index]);
    }
    
    this._storeElements = [];
    this._currentScreen = screen;
    
    $(".main-menu-item").removeClass("selected");
    $(".main-menu-item[screen~='" + screen + "']").addClass("selected");

    $("#Main-ScreenHeader").empty();
    $("#Main-ScreenHeader").hide();
    $("#Main-ScreenContainer").hide();
    $("#Main-ScreenContainer").load("screens/" + screen + ".html", function() {
      $(document).find(".screen-description").appendTo("#Main-ScreenHeader");
      $("#Main-ScreenHeader").show();
      $("#Main-ScreenContainer").fadeIn();
      $("#Main-ScreenContainer").scrollTop(0);
      
      var screenElements = $(document).find(".screen");
      if (screenElements.length > 0) {
        var onShowAttr = screenElements[0].getAttribute("onshow");
        if (onShowAttr != null) {
          eval(onShowAttr);
        }
      }
    });
  }
}