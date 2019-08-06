Main = {
  ACTION_OK: "ok",
  ACTION_YES: "yes",
  ACTION_NO: "no",
  ACTION_CANCEL: "cancel",
  
  DIALOG_TYPE_CONFIRMATION: "confirmation",
  DIALOG_TYPE_ACCEPT: "accept",
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
    
    this.showPrivacyPolicyPanel();
  },
  
  loadScreen: function(screen) {
    window.location.hash = screen;
  },
  
  showPopup: function(title, message) {
    $("#Main-Popup-Frame-Title").html(title);
    $("#Main-Popup-Frame-Details").html(message);
    $("#Main-Popup").show();
  },
  
  hidePopup: function() {
    $("#Main-Popup").hide();
  },
  
  showMessage: function(title, message, actionListener, dialogType) {
    $("#Main-Dialog-Frame-Title").html(title);
    $("#Main-Dialog-Frame-Content-Message").html(message);
    $("#Main-Dialog-Frame-Content-Buttons").show();
    
    function onClick(button) {
      $("#Main-Dialog").hide();
      
      if (actionListener) {
        actionListener(button);
      }
    }
    
    $("#Main-Dialog").show();
    
    dialogType = dialogType || Main.DIALOG_TYPE_INFORMATION;
    
    if (dialogType == Main.DIALOG_TYPE_INFORMATION) {
      function closeDialog() {
        $(document).off("click");
        $(document).off("keyup");
        onClick(Main.ACTION_OK);
      }
      
      
      $("#Main-Dialog-Frame-Content-Buttons-OK").html("OK");
      $("#Main-Dialog-Frame-Content-Buttons-OK").show();
      $("#Main-Dialog-Frame-Content-Buttons-OK").off("click");
      $("#Main-Dialog-Frame-Content-Buttons-OK").click(closeDialog.bind(this));
      $("#Main-Dialog-Frame-Content-Buttons-OK").focus();

      $("#Main-Dialog-Frame-Content-Buttons-Cancel").hide();
      
      setTimeout(function() {
        $(document).click(closeDialog.bind(this));
        $(document).keyup(function(e) {
          if (e.keyCode === 27) {
            closeDialog();
          }
        });
      }, 10);
    } else if (dialogType == Main.DIALOG_TYPE_CONFIRMATION) {
      $("#Main-Dialog-Frame-Content-Buttons-OK").html("OK");
      $("#Main-Dialog-Frame-Content-Buttons-OK").show();
      $("#Main-Dialog-Frame-Content-Buttons-OK").off("click");
      $("#Main-Dialog-Frame-Content-Buttons-OK").click(onClick.bind(this, Main.ACTION_OK));

      $("#Main-Dialog-Frame-Content-Buttons-Cancel").html("Cancel");
      $("#Main-Dialog-Frame-Content-Buttons-Cancel").show();
      $("#Main-Dialog-Frame-Content-Buttons-Cancel").off("click");
      $("#Main-Dialog-Frame-Content-Buttons-Cancel").click(onClick.bind(this, Main.ACTION_CANCEL));
      $("#Main-Dialog-Frame-Content-Buttons-Cancel").focus();
    } else if (dialogType == Main.DIALOG_TYPE_ACCEPT) {
      $("#Main-Dialog-Frame-Content-Buttons-OK").html("Accept");
      $("#Main-Dialog-Frame-Content-Buttons-OK").show();
      $("#Main-Dialog-Frame-Content-Buttons-OK").off("click");
      $("#Main-Dialog-Frame-Content-Buttons-OK").click(onClick.bind(this, Main.ACTION_OK));

      $("#Main-Dialog-Frame-Content-Buttons-Cancel").html("Cancel");
      $("#Main-Dialog-Frame-Content-Buttons-Cancel").show();
      $("#Main-Dialog-Frame-Content-Buttons-Cancel").off("click");
      $("#Main-Dialog-Frame-Content-Buttons-Cancel").click(onClick.bind(this, Main.ACTION_CANCEL));
      $("#Main-Dialog-Frame-Content-Buttons-Cancel").focus();
    } else if (dialogType == Main.DIALOG_TYPE_YESNO) {
      $("#Main-Dialog-Frame-Content-Buttons-OK").html("Yes");
      $("#Main-Dialog-Frame-Content-Buttons-OK").show();
      $("#Main-Dialog-Frame-Content-Buttons-OK").off("click");
      $("#Main-Dialog-Frame-Content-Buttons-OK").click(onClick.bind(this, Main.ACTION_YES));
      $("#Main-Dialog-Frame-Content-Buttons-OK").focus();
      
      $("#Main-Dialog-Frame-Content-Buttons-Cancel").html("No");
      $("#Main-Dialog-Frame-Content-Buttons-Cancel").show();
      $("#Main-Dialog-Frame-Content-Buttons-Cancel").off("click");
      $("#Main-Dialog-Frame-Content-Buttons-Cancel").click(onClick.bind(this, Main.ACTION_NO));
    }
  },
  
  hideMessage: function() {
    $("#Main-Dialog").hide();
  },
  
  
  showPrivacyPolicyPanel: function() {
    var privacyPolicyAccepted = Utils.getCookie("privacyPolicyAccepted");
    if (!privacyPolicyAccepted) {
      setTimeout(function() {
        $("#Main-AcceptCookie").fadeIn();
      }, 3000);
    }
  },
  acceptPrivacyPolicy: function() {
    $("#Main-AcceptCookie").fadeOut();
    Utils.setCookie("privacyPolicyAccepted", "true");
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
  
  
  scrollToElement: function(screenElement) {
    $("#Main-ScreenContainer").scrollTop(screenElement.offset().top - $("#Main-ScreenContainer").offset().top);
    $("#Main-ScreenContainer").scrollLeft(screenElement.offset().left - $("#Main-ScreenContainer").offset().left);
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