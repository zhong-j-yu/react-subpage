var Pager = require('../src/Pager');

var assert = require('assert');


// mock viewer
const v = {
  setPage: function(page,props){
    this.page = page;
    this.props = props;
  }
};

function HomePage(){}
function UserPage(){}
UserPage.counter = 0;
UserPage.onRequest = (page,props,pager)=>{
  UserPage.counter++;
  if(props.name=='REPLACE')
    return pager.replace(HomePage);
  return pager.view(page,props);
}

function HashPage(){}

const urlMap = {
  '/'            : HomePage,
  '/user/:name?' : UserPage,
  '/hash#:name?' : HashPage
}
const pager = new Pager(urlMap, {mockUrl:'/user/zhong', viewer:v});

// perform the `action`, then check the effects.
// however, effect are done async (though immediately).
// we need to delay checking the effects.
function ait(desc, action, effects, moreCheck)
{
  function check()
  {
    function ass(e, t){ if(e)assert.deepEqual(e,t); }

    ass(effects.page, v.page);
    ass(effects.name, v.props.name);
    ass(effects.url, pager.url);
    ass(effects.state, pager.state);
    ass(effects.length, pager.history.entries.length);
    ass(effects.index, pager.history.index);
    ass(effects.counter, UserPage.counter);

    if(moreCheck) moreCheck();
  }

  it(desc, function(done){
    action();
    setTimeout(function(){
      var err;
      try{ check(); } catch(e){ err=e; }
      done(err);
    }, (effects.DELAY||0)); // stupid, but works for us
  })
}


describe('test Pager with mock View, mock History', function()
{
  it('pager.history.mocking', ()=>{
    assert.ok(pager.history.mocking);
    assert.ok(pager.history.entries);
    assert.ok(pager.history.enterUrl);
  })

  it('pager.toUrl()', ()=>{
    assert.equal(pager.toUrl(HomePage), '/');
    assert.equal(pager.toUrl(UserPage), '/user');
    assert.equal(pager.toUrl(UserPage,{name:'zhong'}), '/user/zhong');
    assert.equal(pager.toUrl(UserPage,{name:'zhong/yu'}), '/user/zhong%2Fyu');
    assert.equal(pager.toUrl(HashPage), '/hash#');
    assert.equal(pager.toUrl(HashPage,{name:'zhong'}), '/hash#zhong');
  })


  ait('check init state', ()=>{
    /*nothing*/
  }, {page:UserPage, name:'zhong', length:1, index:0} );

  ait('push()', ()=>{
    pager.push(HomePage);
  }, {page:HomePage, url:'/'} );

  ait('push()', ()=>{
    pager.push(UserPage, {name:'yu'});
  }, {page:UserPage, name:'yu', length:3, index:2} );

  ait('view()', ()=>{
    pager.view(HomePage);
  }, {page:HomePage, length:3, index:2} );
  ait('view() props with custom "pager" field', ()=>{
    pager.view(HomePage, {pager:'hardly', foo:'bar', $pager:pager});
  }, {}, ()=>{
    assert.equal(v.props.pager, 'hardly');
    assert.equal(v.props.foo, 'bar');
    assert.equal(v.props.$pager, pager);
  } );

  ait('view() does not change history entry', ()=>{
    pager.go(0);
  }, {page:UserPage, name:'yu', length:3, index:2} );

  ait('push() clears later entries', ()=>{
    pager.go(-2);
    pager.push(UserPage, {name:'yu'});
  }, {page:UserPage, name:'yu', length:2, index:1} );

  ait('replace()', ()=>{
    pager.go(-1);
    pager.replace(UserPage, {name:'john'});
  }, {page:UserPage, name:'john', length:2, index:0} );
  ait('replace()', ()=>{
    pager.replace('/user/u0');
  }, {page:UserPage, name:'u0', length:2, index:0} );

  ait('push()+replace()+push()', ()=>{
    pager.push(UserPage, {name:'u1'});
    pager.replace('/');
    pager.push('/user/u2');
  }, {page:UserPage, name:'u2', length:3, index:2} );
  ait('push()+replace()+push()', ()=>{
    pager.go(-1);
  }, {page:HomePage, length:3, index:1} );

  // entries:  /user/u0   */    /user/u2
  ait('go() out of range', ()=>{
    pager.go(-2);
  }, {page:HomePage, length:3, index:1} );
  ait('go() out of range', ()=>{
    pager.go(+2);
  }, {page:HomePage, length:3, index:1} );
  ait('go(-1)', ()=>{
    pager.go(-1);
  }, {page:UserPage, name:'u0', length:3, index:0} );
  ait('go(0) triggers onRequest() ', ()=>{
    UserPage.counter = 666;
    pager.go(0);
  }, {counter:667, page:UserPage, name:'u0', length:3, index:0} );
  ait('go(+2)', ()=>{
    pager.go(+2);
  }, {page:UserPage, name:'u2', length:3, index:2} );

  ait('onRequest() does replace()', ()=>{
    pager.push(UserPage,{name:'REPLACE'});
  }, {page:HomePage, url:'/', length:4, index:3, DELAY:30} );

  ait('hash url', ()=>{
    pager.push(HashPage,{name:'zhong'});
  }, {page:HashPage, url:'/hash#zhong', length:5, index:4});
  ait('MockHistory.enterUrl()', ()=>{
    pager.go(-4);
    pager.history.enterUrl('/hash#yu')
  }, {page:HashPage, name:'yu', length:2, index:1});

  ait('pager.state', ()=>{
    pager.state = 's1';
    pager.go(-1);
    pager.state = 's0'
  }, {state:'s0', url:'/user/u0'} );
  ait('pager.state', ()=>{
    pager.go(+1);
  }, {state:'s1', url:'/hash#yu'} );
  ait('pager.state', ()=>{
    pager.go(0);
  }, {state:'s1', url:'/hash#yu'} );

  ait('unknown url', ()=>{
    pager.history.enterUrl('/UNKNOWN');
  }, {page:HashPage, name:'yu', length:3, index:2, url:'/UNKNOWN'} );

  const A = pager.A;
  it('<A>', ()=>{
    var elem = A({page:HomePage, title:'bar', children:'bastards'});
    assert.equal(elem.props.href, '/');
    assert.ok(elem.props.onClick);
    assert.equal(elem.props.title, 'bar');
    assert.equal(elem.props.children, 'bastards');

    elem = A({page:UserPage, props:{name:'zhong'}});
    assert.equal(elem.props.href, '/user/zhong');
    elem = A({page:UserPage, $name:'yu'});
    assert.equal(elem.props.href, '/user/yu');
    assert.equal(elem.props.$name, undefined);
    elem = A({page:UserPage, props:{name:'zhong'}, $name:'yu'});
    assert.equal(elem.props.href, '/user/yu');
    assert.equal(elem.props.$name, undefined);
  })

  ait('<A replace>', ()=>{
    var elem = A({replace:true, page:UserPage, $name:'tom'});
    assert.ok(elem.props.onClick instanceof Function);
    elem.props.onClick({preventDefault:()=>{}});  // replace(UserPage, name:tom)
  },{page:UserPage, name:'tom',length:3, index:2, url:'/user/tom'} );

})
