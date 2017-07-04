
var History = require('./History');
var UrlMapper = require('./UrlMapper');
var Viewer = require('./Viewer');
var Util = require('./Util');


module.exports = Pager;


function Pager(urlMap, options)
{
  var pager = this;
  options = options || {};

  Object.defineProperty(this, 'element', {get:get_element});
  Object.defineProperty(this, 'url',     {get:get_url});
  Object.defineProperty(this, 'state',   {get:get_state, set:set_state});

  this.history = History.newHistory(options.mockUrl);

  this.urlMapper = new UrlMapper(urlMap);

  this.viewer = options.viewer || new Viewer();

  this.A = function(props){ return Util.renderA(pager,props); } // bind this

  toHandle(this, this.history.getUrl(), null);

  this.history.onPopState(function(data,url){
    toHandle(pager, url, null);
  });
}
function get_element()
{
  return this.viewer.getElement();
}
function get_url()
{
  return this.history.getUrl();
}
function get_state()
{
  return this.history.getState();
}
function set_state(state)
{
  this.history.replaceState(state); // same url
}


Pager.prototype.view = function(page, props)
{
  // add `pager` to props (only if it wasn't there)
  props = Util.copy({pager:this}, props);
  this.viewer.setPage(page, props);
}

// push(url)
// push(page,[props])
Pager.prototype.push = function(arg1, arg2)
{
  request(true, this, arg1, arg2);
}

// replace(url)
// replace(page [,props])
Pager.prototype.replace = function(arg1, arg2)
{
  request(false, this, arg1, arg2);
}

Pager.prototype.go = function(delta)
{
  if(delta!==0)
    return this.history.go(delta);
  // browser history.go(0) may refresh the page, and re-init the app.
  // we don't want that. we just want to re-trigger onRequest() handler
  toHandle(this, this.history.getUrl(), null);
  // note: state is kept. same as refresh/F5 the page.
}

// if page is mapped to multiple url patterns, the first pattern wins
Pager.prototype.toUrl = function(page, props)
{
  return this.urlMapper.toUrl({page:page, props:(props||{})});
}


// request a new page (by push or replace)
function request(PUSH, pager, arg1, arg2)
{
  // (arg1,arg2) : either (url) or (page[,props])

  var url, req;
  if(Util.isString(arg1)) // url
  {
    req = null;
    url = arg1;
  }
  else
  {
    req = {page:arg1, props:(arg2||{})};
    url = pager.urlMapper.toUrl(req); // throws
  }

  if(PUSH)
    pager.history.pushState(null, url);
  else
    pager.history.replaceState(null, url); // state is lost

  toHandle(pager, url, req);
}

// schedule to handle the request on next tick.
// we do it async to avoid semantic issue of reentrance/recursion.
// can be called multiple times before next tick
//   -- only the last request will be handled on next tick.
function toHandle(pager, url, req)
{
  if(req) // defensive copy (shallowly) before using it async.
    req.props = Util.copy({}, req.props);

  var h = pager.toHandle;
  if(!h)
  {
    h = pager.toHandle = function(){
      pager.toHandle = null;
      doHandle(pager, h.url, h.req);
    };
    Util.nextTick(h);
  }
  h.url = url;
  h.req = req;
}
function doHandle(pager, url, req)
{
  if(!req)
    req = pager.urlMapper.fromUrl(url); // may return null

  if(!req) // app shoulda had a match-all url pattern.
  {
    if(console && console.error)
      console.error('no page matches url: '+url);
    return;
  }

  var page = req.page;
  var props = req.props;
  // this `props` is our copy. (note: we should not freeze on client's object)
  // we could allow onRequst() to mutate it shallowly. but let's be strict.
  Object.freeze(props);

  if(page.onRequest instanceof Function)
    page.onRequest(page, props, pager);
  else // default hanlding
    pager.view(page, props);
}
