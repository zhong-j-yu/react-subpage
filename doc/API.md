# `react-subpage` API Reference

APIs for
[`react-subpage`](https://github.com/zhong-j-yu/react-subpage)


### `Pager`

This is the main class of the framework.

``` js
import Pager from 'react-subpage';
```

It's not to be used statically. Create an instance instead.

### `new Pager(urlMap, options)`

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

### `pager.element` (readonly)

This is the React element that contains the current page.
It is typically used only once in

```js
ReactDOM.render(pager.element, document.getElementById('root'));
```

### `pager.url` (readonly)

The current URL, without the host part.
Example values: `'/', '/login', '/foo#bar'`


### `pager.view(page,[props])`

Render a page component with props.

`props` is cloned, with `pager` added to it
(unless a `pager` property already existed),
before it's passed to the page component.


### `pager.toUrl(page,[props])`

Map `(page,props)` to URL, using the `urlMap`.

This method may throw error, if `page` is not listed in `urlMap`,
or required URL parameters are not provided in `props`.

Multiple `urlMap` entries may exist for `page`; the 1st one is used.

### `pager.push(page,[props])`

Push a history entry, with URL mapped from `(page,props)`.

The new entry is activated upon method return.

`pager.push(url)` is also supported, but recommended against.

### `pager.replace(page,[props])`

Replace the active history entry, with URL mapped from `(page,props)`.

The new entry is activated upon method return.

`pager.replace(url)` is also supported, but recommended against.

### `pager.go(delta)`

Activate a history entry relative to the currently active entry.


### `pager.state` (read/write)

Read/write the `state` of the currently active history entry.

The value should be JSON-able.
The initial state of a history entry is `null`.



### `onRequest(page,props,pager)`

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


### `pager.A`

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
