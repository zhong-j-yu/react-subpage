# `react-subpage` Tutorial

Tutorial for
[`react-subpage`](https://github.com/zhong-j-yu/react-subpage)

## create a React project with `react-subpage`

```bash
$ create-react-app hello-subpage
$ cd hello-subpage
$ npm install --save react-subpage
$ npm start
```

## HomePage

Let's start by having only one page in our app.
Replace the content of `src/index.js` with the following code,
save the file, and check the browser window.

```js
import React from 'react';
import ReactDOM from 'react-dom';

import Pager from 'react-subpage';

const HomePage = (props)=>
  <div>
    Sweet Home
  </div>

const urlMap = {
  '/' : HomePage
}
const pager = new Pager(urlMap);

ReactDOM.render(pager.element, document.getElementById('root'));
```

We have one page, `HomePage`, that's mapped to URL `'/'`.
We create a `pager` with the `urlMap`.
The root element rendered by React is `pager.element`.


## HelloPage

Now we add another page, `HelloPage`, with a parameter `name`.
For simplicity, we put all code in `src/index.js`.

```js
const HelloPage = (props)  =>
  <div>
    Hello, {props.name}!
  </div>

const urlMap = {
  '/'            : HomePage,
  '/hello/:name' : HelloPage
}
```

Enter the browser URL as `'/hello/world'`, and you'll see the new page.


## NotFound

To catch unmapped URLs, create a `NotFound` page mapping to all URLs,
as the last entry of `urlMap`.

```js
const NotFound = (props)=> <div> 404: {props.url} </div>

const urlMap = {
  '/'            : HomePage,
  '/hello/:name' : HelloPage,
  ':url(.*)'     : NotFound
}
```

Now enter URL `'/foo'`, and you'll see the error page.


## navigation

Let's add a button in `HelloPage` that leads back to the home page.

```js
const HelloPage = ({name,pager})=>
  <div>
    Hello, {name}!
    <button onClick={e=>pager.push(HomePage)}>go home</button>
  </div>
```  

When the button is clicked, `pager.push(HomePage)` causes the app
to switch to `HomePage`.

Similarly, we want to navigate from `HomePage` to `HelloPage`,
with user provided parameter `name`

```js
const HomePage = ({pager})=>
  <div>
    Sweet Home.
    <input placeholder='say hello' onKeyDown={e=>{
      const name = e.target.value;
      if(e.keyCode===13 && name) pager.push(HelloPage,{name});
    }}/>
  </div>
```

Now, enter `my little fiend` on home page, and see what happens.

## pager.A

If we want to have links `<a>`, use component `pager.A`

```js
const HelloPage = ({name,pager:{A}})=>
  <div>
    Hello, {name}!
    ...<A page={HomePage}>go home</A>
    ...<A page={HelloPage} $name='stranger'>hello stranger</A>
  </div>
```

## pager.state

If we use browser BACK button to go back to the home page,
the previously entered value is gone.
Let's fix that by saving the value in `pager.state`.

```js
const HomePage = ({pager})=>
  <div>
    Sweet Home.
    <input defaultValue={pager.state} onKeyDown={e=>{
      const name = pager.state = e.target.value;
      if(e.keyCode===13 && name) pager.push(HelloPage,{name});
    }}/>
  </div>
```

Now enter something, and try browser BACK/FORWARD, we'll see
that the value is retained with that page.

Note that `pager.state` is associated with the current history entry.
If you click `[go home]` button on `HelloPage`, a new history entry
is created, which has `pager.state` as `null`.


## pager.replace()

`pager.replace()` replaces the current history entry, instead of
creating a new one like `pager.push()` does.
This is preferable in some use cases.

Let's replace the two calls of `pager.push()` in `HomePage` and `HelloPage`
with `pager.replace()`, and test the app again.
For `pager.A`, add `replace`, *e.g.*
`<A replace page={HomePage}>`

To start with a clean history, run the app in a new browser tab/window.
Notice how browser BACK button does not work any more,
because we are not creating any new entries.
This may or may not be a usability issue, depending on the use case.

Also notice that the `<input>` field does not retain the value any more.
This is because `pager.replace()` clears the `pager.state`,
which is the intended behavior. To work around that, we can reassign
`pager.state` after `pager.replace()`

```js
const goHome = savedState=>event=>{
  pager.replace(HomePage);
  pager.state=savedState;
}
const HelloPage = ({name,pager})=>
  <div>
    Hello, {name}!
    <button onClick={goHome(name)}>go home</button>
  </div>
```

## onRequest()

`pager.push/replace()` requests for a new page.
The default handling is to simply display the page,
via `pager.view(page,props)`.
We can override that behavior in `onRequest()` to do some custom actions.

One of the reasons for `onRequest()` is to do some data processing.
For example, we want to lookup and display a description for `name` in `HelloPage`

```js

const HelloPage = ({name,desc,pager})=>
  <div>
    Hello, {name}({desc})!
  </div>

HelloPage.onRequest = (page,props,pager)=>{
  const name = props.name.toLowerCase();
  const desc = DICT[name];
  return pager.view(page,{name,desc});
}
const DICT = {'cat':'good', 'rat':'food'};
```

We may also decide to redirect to another page in some cases

```js
HelloPage.onRequest = (page,props,pager)=>{
  if(props.name==="home")
    return pager.replace(HomePage);
  ...
}
```

Or we want to display an alternative view in some cases,


```js
const FancyHello = ({name})=> <h1>Hello, {name}!</h1>

HelloPage.onRequest = (page,props,pager)=>{
  if(window.innerWidth<400)
    return pager.view(FancyHello,props);
  ...
}
```



## see also

[`react-subpage-demo`](https://github.com/zhong-j-yu/react-subpage-demo)
-- a demo app with login, data read/write.
