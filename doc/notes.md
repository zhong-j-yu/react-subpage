some notes, not formally published

## mock history

`pager.history.mocking` tests true if mock history is used.

You can explicitly ask `pager` to use a mock history,
by supplying the initial `mockUrl` option.

```js
const pager = new Pager(urlMap, {mockUrl:'/'});
```

This is mostly for testing. We could also use it on production,
e.g. having two apps in one document, each with independent navigation.
However, the value of a router is really in dealing with browser,
which is pretty nasty. If a GUI doesn't need to worry about that,
page-switching is just business as usual -- rendering different things
based on different app states -- there really isn't a need for "router".


## singleton pager?

Because a pager is only useful if it interacts with the real browser,
it's probably OK if we make it a singleton.
That way, we don't need to pass it around; just access it statically everywhere.
It can still be mocked for testing, by static substitution.

I'm not sure at this point. Leave it as is. If you really want a singleton,
you can always do that by yourself -- save/loader the `pager` on a global site.



## dependency passing

(removed from tutorial)

In the tutorial, we looked up description from a fixed/global `DICT` object.
It might be considered harmful to have such dependencies.
Instead, let's try to pass dependencies in function arguments.

Since the `pager` object is passed around in our application,
we can attach dependencies to `pager` so that they can be accessed.

Of course, someone somewhere must instantiate dependencies to concrete
implementations. This is usually done at app startup phase.
In our case, we do it where `pager` is instantiated

```js
const pager = new Pager(urlMap);
pager.dict = DICT; // or something else
```

In `HelloPage.onRequest()`, we look up from `pager.dict`

```js
   // const desc = DICT[name];
   const desc = pager.dict[name];
```

If we want to do the lookup inside `Hellopage` component,
it too can be done through `pager.dict`

```js
const HelloPage = ({name,pager})=>
  <div>
    Hello, {name}({pager.dict[name]})!
  </div>
// remove HelloPage.onRequest; use default handler
```

Or, we can decouple the component from `pager`, ask all dependencies
passed directly; use `onRequest()` to resolve and inject the dependencies.

```js
const HelloPage = ({name,dict,goHome})=>
  <div>
    Hello, {name}({dict[name]})!
    <button onClick={goHome}>go home</button>
  </div>

HelloPage.onRequest = (page,props,pager)=>{
  props = {
    name : props.name,
    dict : pager.dict,
    goHome : e=>pager.push(HomePage)
  }
  return pager.view(page,props);
}
```
