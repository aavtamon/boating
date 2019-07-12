Utils = {
  getQueryParameterByName: function(name) {
    url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
        
    var results = regex.exec(url);
    if (!results) {
      return "";
    }
    
    if (!results[2]) {
      return "";
    }
    
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  },
  
  getCookie: function(name) {
    var cookies = document.cookie.split(";");
    for (var i in cookies) {
      var cookie = cookies[i].trim();
      var keyValuePair = cookie.split("=");
      if (keyValuePair.length > 1) {
        cookieName = keyValuePair[0];
        if (cookieName == name) {
          return keyValuePair[1];
        }
      }
    }
    
    return null;
  },
  
  setCookie: function(name, value) {
    document.cookie = name + "=" + (value || "") + "; path=/";    
  }
}
