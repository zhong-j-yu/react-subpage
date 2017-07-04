var React = require('react');


exports.NO_OP = function(){}

exports.extractUrl = function(href) // remove (scheme://hostport) part
{
  var regex = /^[^:]+:\/\/[^/]+(.*)/;
  var arr = regex.exec(href);
  if(arr && arr[1])
    return arr[1];
  else // ?
    return '/';
}

exports.nextTick = function(func)
{
  setTimeout(func, 0); // should be fine for our purpose
}

exports.isString = function(x)
{
  return Object.prototype.toString.call(x) === "[object String]"
}

exports.copy = function(target, source)
{
  for(var p in source)
    target[p] = source[p];
  return target;
}

// render <A> to <a>. `propsA` is from <A>
exports.renderA= function(pager,propsA)
{
  // for <a>
  var propsX={}, childrenX=propsA.children;

  // for push/replace(page,props)
  var replace=propsA.replace, page=propsA.page;
  if(!page) throw new Error("pager.A requires property 'page'.");
  // <A props={x:1, y:2} $y={3}>  =>  {x:1,y:3}
  var props=propsA.props || {};

  for(var p in propsA)
  {
    if(p==='replace' || p==='page' || p==='props' || p==='children')
      ;
    else if(p.length>0 && p.charAt(0)==='$')
      props[p.slice(1)] = propsA[p];
    else
      propsX[p] = propsA[p];
  }

  if(!propsX.href)
    propsX.href = pager.toUrl(page,props); // throws
  if(!propsX.onClick)
    propsX.onClick = function(event){
      event.preventDefault();
      replace ? pager.replace(page,props) : pager.push(page,props);
    };

  return React.createElement('a', propsX, childrenX);
}
