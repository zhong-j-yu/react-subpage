// history API used by Pager to interact with browser.
//   methods: pushState() etc

var Util = require('./Util');

exports.newHistory = function (mockUrl)
{
  if(mockUrl)
    return new MockHistory(mockUrl);
  // if user wants mockUrl = browser-current-url for some reason,
  // do that explicitly; no convinience way. (maybe by mockUrl='' ?)
  // user can call `Util.extractUrl(location.href)`

  var TEST_MOCK = false;
  if(!TEST_MOCK && history && history.pushState)
    return new BrowserHistory();

  // legacy browser; or non-browser environment. use mock.
  // mock does not interact with browser. no history. no url change.
  // the init URL still determines the init page.
  // hash-only url change (click,bookmark) does not work.
  var initUrl = '/';
  if(location && location.href)
    initUrl = Util.extractUrl(location.href);
  return new MockHistory(initUrl);
}


// Browser History API with pushState() support ==============================

function BrowserHistory()
{
  // see https://bugzilla.mozilla.org/show_bug.cgi?id=1185420#c3
  window.addEventListener('unload', function(){});
}
BrowserHistory.prototype.go = function(delta)
{
  window.history.go(delta);
}
BrowserHistory.prototype.pushState = function(state, url)
{
  window.history.pushState(state, "", url);
}
BrowserHistory.prototype.replaceState = function(state, url)
{
  if(!url) url = this.getUrl();
  window.history.replaceState(state, "", url);
}
// just `path[?query][#fragment]` , no `scheme://host`
BrowserHistory.prototype.getUrl = function()
{
  // it doesn't work to just concat window.location's pathname+search+hash
  // because search & hash are all empty in cases of '/', '/?', '/#' etc.
  // but, per https://tools.ietf.org/html/rfc3986#section-6.2.3
  // empty hash/query is not the same as "undefined",
  // '/', '/?', '/#' are all distinct URLs.
  return Util.extractUrl(window.location.href);
}
BrowserHistory.prototype.getState = function()
{
  return window.history.state;
}
BrowserHistory.prototype.onPopState = function(callback)  // callback(state, url)
{
  var thiz = this;
  function listener(event){
    callback(thiz.getState(), thiz.getUrl());
  }

  window.addEventListener('popstate', listener);

  // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/3740423/
  // IE bug: sometimes (e.g. clicking a bookmark that differs only in hash)
  // `popstate` event is not fired, but `hashchange` is fired.
  // we need to listen to both events. fortuntely, when both are fired,
  // toHandle() accumulates them, and doHandle() is triggered only once.
  if(window.navigator.userAgent.indexOf("Trident/")>0 ) // IE 9-11
    window.addEventListener('hashchange', listener);
}
// we can't have a history.close() method to clean up the listeners,
// because they are needed when old history entries are re-visited.






// Mock history ==============================================================
// app can test `if(pager.history.mocking)`.
// if mocking, app can use access
//   enterUrl(), go(), index, entries.length, entries[i].url

function MockHistory(initUrl)
{
  this.mocking = true;

  this.callback = Util.NO_OP;

  this.entries = [];
  this.index = -1;

  this.pushState(null, initUrl);
}

MockHistory.prototype.go = function(delta)
{
  var newIndex = this.index+delta;
  if(newIndex<0 || newIndex>=this.entries.length)
    return; // do nothing
  this.index = newIndex;
  this.firePopState();
}
MockHistory.prototype.firePopState = function()
{
  var callback = this.callback;
  callback(this.getState(), this.getUrl());
}
MockHistory.prototype.pushState = function(state, url)
{
  this.entries.splice(++this.index, this.entries.length, {state:state,url:url});
}
MockHistory.prototype.replaceState = function(state, url)
{
  if(!url) url = this.getUrl();
  this.entries[this.index] = {state:state, url:url};
}
MockHistory.prototype.getUrl = function()
{
  return this.entries[this.index].url;
}
MockHistory.prototype.getState = function()
{
  return this.entries[this.index].state;
}
MockHistory.prototype.onPopState = function(callback)
{
  this.callback = callback;
}
MockHistory.prototype.enterUrl = function(url)
{
  this.pushState(null, url);
  this.firePopState();
}
