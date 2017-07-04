# react-subpage

A conventional client-side router for React.

see also:
- [Tutorial](https://github.com/zhong-j-yu/react-subpage/blob/master/Tutorial.md) --
  a step-by-step, hello-world tutorial
- [`react-subpage-demo`](https://github.com/zhong-j-yu/react-subpage-demo) --
  a demo app with login, data read/write.


## basic ideas

This framework is similar to conventional server-side routing solutions

- an application contains distinct **pages**
- a page can be **requested** through API or URL
- a request can be **handled** with custom actions

## page

A page is a React component rendering the entire view.
A page may have parameters. For example,

```js
const HomePage  = (props)=> <div> Sweet Home </div>

const HelloPage = (props)=> <div> Hello, {props.name}! </div>

const NotFound  = ({url})=> <div> 404: {url} </div>
```
Often, different pages share some outer frames;
it is the job of a page to assemble necessary
components to form the whole view.

## URL map

The application should map all possible URLs to pages.

```js
const urlMap = {
  '/'            : HomePage,
  '/hello/:name' : HelloPage,
  '/nihao#:name' : HelloPage,
  ':url(.*)'     : NotFound
}
```

The order of mapping matters; earlier entries have higher priorities.
*(We assume iteration order of object properties...)*
Notice the last entry that catches all URLs not matched by previous entries.

We use [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters)
to model URL patterns.
Both *path* and *hash* are supported.
An application may choose URLs that differ only in hashes, *e.g.*
`/prefix, /prefix#foo, /prefix#bar:param`

This is the only place that your application code needs to address URLs.
The rest of code should only address pages by their type and parameters,
*i.e.* `HelloPage, {name:'foo'}` *etc.*
The framework will map them back to URLs whenever necessary.

## initialization

We need to create a new **pager** object
which the application will interact with.
The `pager.element` is for `ReactDOM` to render at root.


```js
// index.js
import Pager from 'react-subpage';
import ReactDOM from 'react-dom';

const urlMap = ...
const pager = new Pager(urlMap);

ReactDOM.render(pager.element, document.getElementById('root'));
```

At this point, you can enter URLs in browser to reach different pages.

## history entries

Before introducing pager APIs, we need to understand browser history.

For every document, the browser maintains an array of **history entries**.
A history entry contains `{url,state}`.

At any moment, there is an **active** entry
(not necessarily the last one), after it's **activated**.
The user can activate any history entries ant any time,
typically through browser's `back, forward, refresh` buttons.
(Each "activate" is a distinct action, even on an already-active entry.)

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
or clicks a `<a>` with default behavior,
a new history entry is *push-ed*.

Now, let's see how the application code can interact with history
through pager APIs.

## pager.push/replace(page,props)

`pager.push(page,[props])` requests a new page. For example

```js
  pager.push(HomePage);

  pager.push(HelloPage,{name:'world'});
```

by default, the requested page is then rendered in browser.

The method is typically invoked in event handlers, for example,

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
The `page` argument doesn't have to be listed in `urlMap`;
it can be any React component.

The `pager` object is added to `props` so that `pager` can be accessed
by the page component.

`pager.view()` is mostly invoked in response to history entry activation
 (see below).



## onRequest(page,props,pager)

Each time a history entry is *activated*, the framework resolves
`page` and `props`, then invokes `page.onRequest(page,props,pager)`.
(Note that `page` is a React component class/function (*e.g.* `HelloPage`),
  where `onRequest()` is a "static" method.)

If `page.onRequest()` is missing, it is equivalent to having
the default implementation `{ pager.view(page,props); }` --
*i.e.* the default handling is to just render the page.

An example `onRequest()` -

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

For example, in an application, after user logs in,
`pager.push(SecretePage)` is called, which triggers `SecretePage.onRequest()`.
However, `SecretePage.onRequest()` must not assume that the user has logged in,
because it can be triggered in other ways. For example,
the user logs out, then another guy uses `back` button to reach the secrete page.


## pager.state

Every history entry has a `state`.
The `state` of the active entry can be accessed through `pager.state`.

The following example saves the input value in `pager.state`,
so that user input can survive back/forward buttons.
```html
<input defaultValue={pager.state} onChange={e=>pager.state=e.target.value}/>
```

The value of `pager.state` should be JSON-able; it is initially `null`.
To change the value, `pager.state` must be reassigned.
The value could be lost for various reasons;
do not depend on it for critical logic.

Note that `pager.push/replace()` creates a new entry with null state.


## pager.go(delta)

`pager.go(delta)` activates a history entry relative to the currently active one.

`pager.go(-1)` is "going back" one entry.

`pager.go(0)` is "refreshing" the current entry;
the `onRequest()` handler will be triggered.


## pager.A

`pager.A` is a React component for rendering `<a>` links,
that invoke `pager.push/replace()` when clicked.

In [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html#user-defined-components-must-be-capitalized),
you need to assign `pager.A` to a capitalized variable first.

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
or service (*e.g.* a storage interface).
Such dependencies can be resolved by a global singleton.
Or, we may prefer all dependencies passed in explicitly.

Since the `pager` object is passed around to pages,
we can attach dependencies to `pager`, so that they can be accessed in pages.

The dependencies are instantiated at app startup, where `pager` is created

```js
const pager = new Pager(urlMap);
pager.db = new SomeDatabase(someAddress);
```

then later, `onRequest()` handlers and page components can access the database
through `pager.db`.

It may be desirable to further decouple page components from `pager` --
enumerate required dependencies,
shift dependency resolution to `onRequest()`

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

If the browser does not support
[history.pushState](https://developer.mozilla.org/en-US/docs/Web/API/History_API),
`pager` will use a mock history instead.
You may consider poly-fill `history.pushState`,
but it's probably not worthwhile nowadays.

The mock history does not interact with the browser,
therefore browser's back/forward buttons won't work,
and the URL bar does not reflect page changes.
Other than that, the application functions properly.

You can also explicitly ask `pager` to use a mock history,
by supplying the initial `mockUrl` option.

```js
const pager = new Pager(urlMap, {mockUrl:'/'});
```

This can be useful if you actually don't want browser history
being affected by the app. You can even host multiple pagers
in the same document, each serving an independent panel.

`pager.history.mocking` tests true if mock history is used.
The app may add its own back button that invokes `pager.go(-1)`





# API Reference

## `Pager`

This is the main class of the framework.

``` js
import Pager from 'react-subpage';
```

It's not to be used statically. Create an instance instead.

## `new Pager(urlMap, options)`

Create an instance of `Pager`.

`urlMap` - an object, with enumerable properties of `url:page`
- `url` - a url pattern in the format of
  [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters)
- `page` - a React component

`options` -
- `mockUrl` - if provided, the pager will use a mock history,
  with `mockUrl` as the initial URL.

The order of entries in `urlMap` is significant.
We use `for(..in..)` to enumerate its entries,
assuming that the order is consistent across browsers.
Example map: `{'/':Home, '/login':Login }`

## `pager.element` (readonly)

This is the React element that contains the current page.
It is typically used only once in

```js
ReactDOM.render(pager.element, document.getElementById('root'));
```

## `pager.url` (readonly)

The current URL, without the host part.
Example values: `'/', '/login', '/foo#bar'`


## `pager.view(page,[props])`

Render a page component with props.

`props` is cloned, with `pager` added to it
(unless a `pager` property already existed),
before it's passed to the page component.


## `pager.toUrl(page,[props])`

Map `(page,props)` to URL, using the `urlMap`.

This method may throw error, if `page` is not listed in `urlMap`,
or required URL parameters are not provided in `props`.

Multiple `urlMap` entries may exist for `page`; the 1st one is used.

## `pager.push(page,[props])`

Push a history entry, with URL mapped from `(page,props)`.

The new entry is activated upon method return.

`pager.push(url)` is also supported, but recommended against.

## `pager.replace(page,[props])`

Replace the active history entry, with URL mapped from `(page,props)`.

The new entry is activated upon method return.

`pager.replace(url)` is also supported, but recommended against.

## `pager.go(delta)`

Activate a history entry relative to the currently active entry.


## `pager.state` (read/write)

Read/write the `state` of the currently active history entry.

The value should be JSON-able.
The initial state of a history entry is `null`.



## `onRequest(page,props,pager)`

After a history entry is activated, immediately (but asynchronously) --

- map the URL to `(page,props)`,
  using the 1st matching entry in `urlMap`

- if function `page.onRequest` is not present, act as if
  it's defined as <br/> `(page,props,pager)=>pager.view(page,props)`

- invoke `page.onRequest(page,props,pager)`

If there are accumulative activations,
it's possible that only the last one triggers `onRequest`.
For example, calling back-to-back `pager.push(X);pager.push(Y);`
will create 2 history entries; but `X.onRequest()` *may* be skipped.


## `pager.A`

React component that renders `<a>`.

```
   const A = pager.A;
   ...
   <A page={Hello} $name='world'> hello world </A>
```

Props of `A` -

- `page` - *required*, the target page component

- `props` - the props for the page, default `{}`

- *`$foo`* - add `foo` to `props`

- `replace` - if true, will call `pager.replace()` instead of `pager.push()`

- others - passed to `<a>`

Example:

```html
    <A id='p2' replace page={P} props={{x:1}} $x={2} > children.. </A>
renders to:
    <a id='p2' href='/p/2' onClick={e=>{
      e.preventDefault();
      pager.replace(P,{x:2});
    }}> children.. </a>
```
