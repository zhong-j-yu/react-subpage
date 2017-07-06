# react-subpage

[`react-subpage`](https://github.com/zhong-j-yu/react-subpage)
is a conventional client-side router for [React](https://facebook.github.io/react/).

- an application contains distinct **pages**
- a page can be **requested** through API or URL
- a request can be **handled** with custom actions

## page

A page is a React component rendering the entire view.
A page may have *parameters*. For example,

```js
import React from 'react';

const HomePage  = (props)=> <div> Sweet Home </div>

const HelloPage = (props)=> <div> Hello, {props.name}! </div>

const NotFound  = ({url})=> <div> 404: {url} </div>
```
Often, different pages share some outer frames;
it is the job of a page to assemble necessary
components to form the whole view.

## URL map

The application should map *all* possible URLs to pages.

```js
const urlMap = {
  '/'            : HomePage,
  '/hello/:name' : HelloPage,
  '/nihao#:name' : HelloPage,  // alt url
  ':url(.*)'     : NotFound
}
```

The order of mapping matters.
*(We assumed a consistent iteration order of object properties.)*
Earlier entries have higher priorities, in both parsing and generating URLs.
Notice the last entry which catches all URLs not matched by previous entries.

We use [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters)
to model URL patterns.
Both *path* and *hash* are supported.
An application may prefer URLs that differ only in hashes, *e.g.*
`/prefix, /prefix#foo, /prefix#bar:param`

`urlMap` is the only place that your application code needs to address URLs.
The rest of code should only address pages by their types and parameters,
*e.g.* `(HelloPage,{name:'foo'})`.
The framework will generate URLs wherever needed.

## initialization

We need to create a new **pager** object with `urlMap`;
pass `pager.element` to `ReactDOM`.


```js
// index.js
import Pager from 'react-subpage';
import ReactDOM from 'react-dom';

const urlMap = ...

const pager = new Pager(urlMap);

ReactDOM.render(pager.element, document.getElementById('root'));
```

At this point, you can manually enter URLs in browser to reach different pages.

## history entries

For every document, the browser maintains an array of **history entries**.
A history entry contains `{url,state}`.

At any moment, there is an **active** entry
(not necessarily the last one).
The user can **activate** any history entry ant any time,
typically through browser's `back, forward` buttons.


When the document is first loaded, there is one history entry,
containing the initial URL. Afterwards, history entries evolve in 2 ways:
- **push** -
  add a new entry after the active entry
  (remove later entries if any)
- **replace** -
  replace the active entry with a new entry
  (other entries are not affected)

in either operation, the new entry is then activated.

When user enters a URL manually, or clicks a bookmark,
or clicks a vanilla `<a>`,
a new history entry is *push-ed*.

Now, let's see how the application code can interact with history
through pager APIs.

## pager.push/replace(page,props)

`pager.push(page,[props])` requests a new page. For example

```js
  pager.push(HomePage);

  pager.push(HelloPage,{name:'world'});
```

This method is typically invoked in event handlers, for example,

```js
const HelloPage = ({name,pager})=>
  <div>
    Hello, {name}!
    <button onClick={e=>pager.push(HomePage)}>go home</button>
  </div>
```  

(The `pager` object is passed through `props` to page components,
as explained later.)

Another method, `pager.replace()`, does the similar thing.
The difference is, of course, regarding history entries.
Either way, a new history entry is created and *activated*.




## pager.view(page,props)

`pager.view(page,[props])` simply renders the page;
it has *no* effect on history entries.
The `page` argument can be any React component;
it doesn't have to exist in `urlMap`.

The page component will see `pager` in `props`, added by `pager.view()`.

`pager.view()` is usually invoked as a response to history entry activation
 (see below).



## onRequest(page,props,pager)

Each time a history entry is *activated*, the framework resolves
`page` and `props`, then invokes `page.onRequest(page,props,pager)`.
(Note that `onRequest()` is a "static" method of `page`.)

If `page.onRequest()` is missing, it is equivalent to having
the default implementation `{ pager.view(page,props); }`,
that is, simply rendering the page.

A more complex example of `onRequest()` -

```js
HelloPage.onRequest = (page,props,pager)=>
{
  props = { name: props.name.toLowerCase() }; // input processing
  if(props.name==="home")
    return pager.replace(HomePage);    // redirect
  else if(isFriday())
    return pager.view(ByePage, props); // alt view
  else
    return pager.view(page,props);     // default behavior
}
```

A history entry may be activated multiple times
(*e.g.* through back/forward buttons).
A history entry may be activated without a previous `pager.push/replace()` call
(*e.g.* user clicks a link that maps to the page).
Therefore, `onRequest()` should not make some assumptions about application state.

For example, after user logs in,
app calls `pager.push(SecretePage)`, which triggers `SecretePage.onRequest()`.
However, `SecretePage.onRequest()` can be triggered by other causes too,
therefore it must *not* assume that the user has just logged in;
instead, it must check for authentication every time it is invoked.


## pager.state

Every history entry constains a `state`.
The `state` of the currently active entry can be accessed through `pager.state`.

The following example saves the input value in `pager.state`,
so that it can persist through back/forward navigations.
```html
<input defaultValue={pager.state} onChange={e=>pager.state=e.target.value}/>
```

The value of `pager.state` should be JSON-able.
The initial value is `null`.
`pager.push/replace()` creates a new entry with null state.

To change the value, `pager.state` must be reassigned to.
That is, `pager.state.foo=bar` does not work;
it needs to be `pager.state={foo:bar}`



## pager.go(delta)

`pager.go(delta)` activates an existing history entry relative to the currently active entry.

`pager.go(-1)` means "going back" one step.

`pager.go(0)` means "refreshing" the current entry;
the `onRequest()` handler will be triggered.
(Browser `refresh` will reload the document; `pager.go(0)`.)


## pager.A

`pager.A` is a React component for rendering `<a>` links;
when clicked, `pager.push/replace()` are invoked.

In [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html#user-defined-components-must-be-capitalized),
you need to assign `pager.A` to a capitalized variable first,

```js
  class HelloPage extends React.Component{
    render(){
      const A = this.props.pager.A;
      ...
    }
  }

  // or, with object destructuring
  const HelloPage = ({name, pager:{A}})=> ...
```

and then, use it as `<A page={...}>`
```html
    <A page={HomePage}>go home</A>
```

You can specify page parameters with `props` or `$` prefix
```html
  <A id='hw' page={HelloPage} props={{name:'world'}}>

  <A id='hw' page={HelloPage} $name='world'>
```

To do a `replace` instead of `push`
```html
    <A replace page={HomePage}>
```




## dependency passing

A page often depends on some external data (*e.g.* a config string)
or services (*e.g.* a storage interface).
Such dependencies can be wired statically
-- or, we may prefer all dependencies passed in explicitly.

Since the `pager` object is passed around to pages,
we can attach dependencies to `pager`, so that they can be accessed in pages.

The dependencies are instantiated at app startup, where `pager` is created

```js
const pager = new Pager(urlMap);
pager.db = new SomeDatabase(someAddress);
```

then later, `onRequest()` handlers and page components can access the database
through `pager.db`.

It may be desirable to further decouple page components from `pager`.
The page component enumerates required dependencies;
the `onRequest()` handler resolves the dependencies.

```js
const EditPage = ({db, item}) => ...

EditPage.onRequest = (page,props,pager)=>
{
  const db = pager.db;
  const item = db.lookup(props.id);
  if(item)
    return pager.view(page, {db,item});
  ...  
}
```

## mock history

This framework requires browser support of
[history.pushState](https://developer.mozilla.org/en-US/docs/Web/API/History_API).
If the browser does not support it, `pager` will use a *mock history* instead.
You may consider poly-fill, but that's probably not worth the effort.

The mock history does not interact with the browser,
therefore the browser back/forward buttons won't work,
and the URL bar does not reflect page changes.
Other than that, the application functions properly.



## see also

- [API](https://github.com/zhong-j-yu/react-subpage/blob/master/doc/API.md)

- [Tutorial](https://github.com/zhong-j-yu/react-subpage/blob/master/doc/Tutorial.md) --
  a step-by-step, hello-world tutorial

- [`react-subpage-demo`](https://github.com/zhong-j-yu/react-subpage-demo) --
  a demo app with login, data read/write.
