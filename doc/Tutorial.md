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

We have one page, `HomePage`, mapped to URL `'/'`.
We created a `pager` with the `urlMap`.
`ReactDOM` renders `pager.element` at root.


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

Change the browser URL to `'/hello/world'`, and you'll see the new hello page.


## NotFound

To catch unmapped URLs, create a `NotFound` page that maps to all URLs,
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


## pager.push()

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

Similarly, on `HomePage`, we want to navigate to `HelloPage` with `name` parameter.
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

Now, enter `my little fiend` in the input box, and see what happens.

## pager.A

If you want to have links `<a>`, use component `pager.A`

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
the previously entered value in `<input>` is gone.
Let's fix that by saving the value in `pager.state`.

```js
const HomePage = ({pager})=>
  <div>
    Sweet Home.
    <input defaultValue={pager.state} onKeyUp={e=>{
      const name = pager.state = e.target.value;
      if(e.keyCode===13 && name) pager.push(HelloPage,{name});
    }}/>
  </div>
```

Now enter something, and try browser BACK/FORWARD, we'll see
that the value is retained with that page.



## pager.replace()

`pager.replace()` replaces the current history entry, instead of
creating a new one like `pager.push()` does.
This is preferable in some use cases.

Let's replace the calls of `pager.push()`
with `pager.replace()`, and test the app again.
For `pager.A`, add `replace`, *e.g.*
`<A replace page={HomePage}>`

To start with a clean history, run the app in a new browser tab/window.
Notice how browser BACK button does not work any more,
because we are not creating any new entries.
This may be a feature or a bug, depending on the requirement.


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
const DICT = {'cat':'meow', 'dog':'woof'};
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

- [`react-subpage` document](https://github.com/zhong-j-yu/react-subpage/blob/master/doc/Document.md)

- [`react-subpage-demo`](https://github.com/zhong-j-yu/react-subpage-demo)
-- a demo app with login, data read/write.
