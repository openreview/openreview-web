/**
 * Changes:
 * - module.exports
 * - add local token var and a new setToken method
 */
module.exports = (function() {
  // Save authentication token as a private var
  var token;
  var sm = mkStateManager();

  var update = function(key, val, noUpdate) {
    if (key === 'token') return;
    if (!noUpdate) {
      sm.update(key, val);
    }
  };

  var removeHandler = function(name) {
    update('loadingCount', 0);
    sm.removeHandler(name);
  };

  var removeAllButMain = function() {
    update('loadingCount', 0);
    var $content = $('#content');
    if ($content.length) {
      $content.empty();
    }
    sm.removeAllBut('main');
  };

  var http = function(method, useJson) {
    return function(url, data, onSuccess, onError, noLoadCount) {

      if (!noLoadCount) {
        update('loadingCount', (sm.get('loadingCount') || 0) + 1);
      }

      var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
      var authHeaders =  token ? { Authorization: 'Bearer ' + token } : {};
      var baseUrl = window.OR_API_URL ? window.OR_API_URL : '';
      return $.ajax({
        cache: true,
        dataType: 'json',
        type: method,
        contentType: useJson ? 'application/json; charset=UTF-8' : 'application/x-www-form-urlencoded; charset=UTF-8',
        url: baseUrl + url,
        data: useJson ? JSON.stringify(data) : data,
        headers:  Object.assign(defaultHeaders, authHeaders),
        xhrFields: {
          withCredentials: true
        }
      })
      .then(function(result) {
        if (typeof onSuccess === 'function') {
          return onSuccess(result);
        }
        return result;
      }, function(jqXhr, textStatus, errorThrown) {
        console.warn('Xhr Error: ' + errorThrown + ': ' + textStatus);
        console.warn('jqXhr: ' + JSON.stringify(jqXhr, null, 2));

        var errorResponse = jqXhr.responseJSON;
        var errorText = 'Something went wrong';
        if (textStatus === 'timeout') {
          // If the request timed out, display a special message and don't call
          // the onError callback to prevent it from chaning or not displaying the mesage.
          errorText = 'OpenReview is currently under heavy load. Please try again soon.';
          promptError(errorText);
          return;
        }

        if (errorResponse) {
          if (errorResponse.errors && errorResponse.errors.length) {
            errorText = errorResponse.errors[0];
          } else if (errorResponse.message) {
            errorText = errorResponse.message;
          }
        }

        if (errorText === 'User does not exist') {
          location.reload(true);
        } else {
          if (typeof onError === 'function') {
            return onError(jqXhr, errorText);
          } else {
            promptError(errorText);
          }
        }
      })
      .always(function() {
        if (!noLoadCount) {
          var newCount = sm.get('loadingCount') - 1;
          update('loadingCount', newCount > 0 ? newCount : 0);
        }
      });

    };
  };

  var sendFile = function(url, data) {
    return $.ajax({
      url: url,
      type: 'put',
      cache: false,
      dataType: 'json',
      processData: false,
      contentType: false,
      data: data,
      headers: { 'Authorization': 'Bearer ' + (sm.has('token') ? sm.get('token') : '') }
    }).fail(function(jqXhr, textStatus, errorThrown) {
      console.warn('Xhr Error: ' + errorThrown + ': ' + textStatus);
      console.warn('jqXhr: ' + JSON.stringify(jqXhr, null, 2));
    });
  };

  var post = http('post', true);

  var get = http('get', false);

  var patch = http('patch', true);

  var put = http('put', true);

  var login = function(id, password, success) {
    return post(
      '/login',
      {id: id, password: password},
      function(result) {
        update('token', result.token);
        if (typeof success === 'function') {
          success();
        }
      }
    );
  };

  var logout = function(success) {
    return post(
      '/logout', {},
      function(result) {
        sm.clean();
        var token = getToken();
        update('token', token);
        if (typeof success === 'function') {
          success();
        } else {
          window.location.href = '/';
        }
      }
    );
  };

  var setToken = function(newAccessToken) {
    token = newAccessToken;
  };

  var getToken = function() {
    var token = readAuthCookie();
    return token;
  };

  var readAuthCookie = function() {
    var token = '';
    document.cookie.split(';').forEach(function(cookie) {
      var split = cookie.split('=');
      if (split.length === 2 && split[0].trim() === 'openreview_sid') {
        token = split[1];
      }
    });
    return token;
  };

  var readRedirectCookie = function() {
    var redirectPath = document.cookie.replace(/(?:(?:^|.*;\s*)redirect\s*\=\s*([^;]*).*$)|^.*$/, '$1');
    return redirectPath;
  };

  var deleteRedirectCookie = function() {
    document.cookie = 'redirect=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  };


  return {
    addHandler: sm.addHandler,
    removeHandler: removeHandler,
    removeAllButMain: removeAllButMain,
    update: update,
    getToken: getToken,
    setToken: setToken,
    login: login,
    logout: logout,
    post: post,
    get: get,
    patch: patch,
    put: put,
    sendFile: sendFile,
    readRedirectCookie: readRedirectCookie,
    deleteRedirectCookie: deleteRedirectCookie
  };

})();
