// two-way mapping between url and {page, props}

var pathToRegexp = require('path-to-regexp');

/*   path vs hash
an app can mix path and hash patterns; tho usually it picks one strategy
    /   /abc    /foo/:bar
    /#   /#abc   /#foo/:bar
note: `/#` seems unnecessary; could use just `/`. but going from '/#foo' to
'/', i.e. losing the hash, triggers doc reload on firefox.
better map HomePage to both '/#' and '/', in that order.
OR, during app init, do somethign like: if(pager.url==='/') pager.replace('/#')

quote lib doc:  https://github.com/pillarjs/path-to-regexp
      ... intended for use with pathnames
      ... can not handle the query strings or fragments of a URL
not sure what that means exactly. experiments show that it does work
with patterns like `/abc#:foo/:bar`. therefore, we can use it for path or hash;

It also seems ok to have parameters in both path and hash,
like `/:foo#:bar`. Or maybe even in query.
But this requires more investigation; we do not advertise it for now.

*/


module.exports = UrlMapper;

var OPTIONS = {sensitive: true};

function UrlMapper(urlMap)
{
  this.entries = [];
  for(var url in urlMap)
    this.entries.push(new Entry(url, urlMap[url]));
  // note: the order of entries is important.
  // here, we depend on the iteration order of for(..in..)
  // we assert that the order is stable and consistent across browsers.
  // see https://stackoverflow.com/q/280713
}
function Entry(url, page)
{
  this.url = url;
  this.page = page;
  this.keys = [];
  this.regexp = pathToRegexp(url, this.keys, OPTIONS);
  this.toPath = pathToRegexp.compile(url);
}




UrlMapper.prototype.fromUrl  = function(url)
{
  for(var i=0; i<this.entries.length; i++)
  {
    var entry = this.entries[i];
    var m = entry.regexp.exec(url);
    if(m)
      return toPageProps(url, m, entry.keys, entry.page);
  }
  // no match
  return null;
}
function toPageProps(url, m, keys, page)
{
  try{
    var props = {};
    for(var i=1; i<m.length; i++)
    {
      var val = m[i];  // can be undefined
      if(val)
        val = decodeURIComponent(val);
      var key = keys[i-1];
      props[key.name] = val;
    }
    return {page:page, props:props};
  }catch(error){
    console.warn('Error parsing URL', url, error.message);
    return null;
  }
}





UrlMapper.prototype.toUrl = function(req) // throws
{
  var page = req.page;
  var props = req.props;

  var i;
  for(i=0; i<this.entries.length; i++) // find 1st matching page
  {
    var entry = this.entries[i];
    if(entry.page===page)
      return entry.toPath(props); // throws
  }
  throw new Error('unknown page: ' + page);
}
