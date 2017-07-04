/*
a viewer showing the current page. methods:
  getElement()
    return the React elment for ReactDOM.render()
  setPage()
    called by pager to set the current page
new Pager() accepts a mock `options.viewer` for testing purpose.
*/

var React = require('react');

module.exports = Viewer;

// viewer -> element -> component
// basically, `viewer.setPage()` triggers `component.setState()`
// however, `component` is created async, may not be ready yet.
// so, save `pp`, to be used later as the init state of component.

function Viewer()
{
  this.pp = {page:'div', props:{title:'nothing yet'}};
  this.element = null;
  this.component = null;
}
Viewer.prototype.getElement = function()
{
  if(!this.element)
    this.element = React.createElement(MyComponent, {viewer:this});
  return this.element;
}
Viewer.prototype.setPage = function(page, props)
{
  this.pp = {page:page, props:props};
  if(this.component)
    this.component.setState(this.pp);
}



// class MyComponent extends React.Component {
//   constructor(props) {
//     super(props);
//     props.viewer.component = this;
//     this.state = props.viewer.pp;
//   }
//   render() { ... }
// }

MyComponent.prototype = Object.create(React.Component.prototype);
MyComponent.prototype.constructor = MyComponent;
function MyComponent(props)
{
  React.Component.call(this, props);
  props.viewer.component = this;
  this.state = props.viewer.pp;
}
MyComponent.prototype.render = function()
{
  var pp = this.state;
  return React.createElement(pp.page, pp.props);
}
