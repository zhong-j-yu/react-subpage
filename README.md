# react-subpage

A conventional client-side router for React.

### basic ideas

- an application contains distinct **pages**
- a page can be **requested** through API or URL
- a request can be **handled** with custom actions

### read more

- [Document](https://github.com/zhong-j-yu/react-subpage/blob/master/doc/Document.md)

- [API](https://github.com/zhong-j-yu/react-subpage/blob/master/doc/API.md)

- [Tutorial](https://github.com/zhong-j-yu/react-subpage/blob/master/doc/Tutorial.md) --
  a step-by-step, hello-world tutorial

- [`react-subpage-demo`](https://github.com/zhong-j-yu/react-subpage-demo) --
  a demo app with login, data read/write.


### basic usage

`urlMap, pager.push(), <A>`

```js
import React from 'react';
import ReactDOM from 'react-dom';

import Pager from 'react-subpage';

const HomePage = (props)=>
  <div>
    <h1>home</h1>

    <button onClick={e=>props.pager.push(HelloPage,{name:'world'})}>
      hello world
    </button>
  </div>

class HelloPage extends React.Component{
  render(){
    const A = this.props.pager.A;
    return <div>
      <h1>hello {this.props.name}!</h1>

      <A page={HomePage}> back home </A>
    </div>
  }
}  

const urlMap = {
  '/'            : HomePage,
  '/hello/:name' : HelloPage
}
const pager = new Pager(urlMap);

ReactDOM.render(pager.element, document.getElementById('root'));
```



<br/><br/><br/>
creatd by [Zhong Yu](http://zhong-j-yu.github.io/)
