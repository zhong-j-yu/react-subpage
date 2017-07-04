
var UrlMapper = require('../src/UrlMapper');

var assert = require('assert');

function HomePage(){}
function UserPage(){}
function HashPage(){}
function NotFound(){}

describe('test UrlMapper', function()
{
  describe('basic functions', function()
  {
    var urlMap = {
      '/'           : HomePage,
      '/home'       : HomePage,
      '/user/:name' : UserPage,
      '/foo#x/:a/:b': HashPage,
      ':url(.*)'    : NotFound
    }
    var mapper = new UrlMapper(urlMap);

    it('generate /', function(){
      assert.equal('/', mapper.toUrl({page:HomePage}));
    });
    it('generate /user/zhong', function(){
      assert.equal('/user/zhong', mapper.toUrl({page:UserPage, props:{name:'zhong'}}));
    });
    it('generate /foo#x/y/z', function(){
      assert.equal('/foo#x/y/z', mapper.toUrl({page:HashPage, props:{a:'y',b:'z'}}));
    });

    it('parse /', function(){
      assert.deepEqual(mapper.fromUrl('/'), {page:HomePage, props:{}});
    });
    it('parse /home', function(){
      assert.deepEqual(mapper.fromUrl('/home'), {page:HomePage, props:{}});
    });
    it('parse /user/zhong', function(){
      assert.deepEqual(mapper.fromUrl('/user/zhong'), {page:UserPage, props:{name:'zhong'}});
    });
    it('parse /foo#x/y/z', function(){
      assert.deepEqual(mapper.fromUrl('/foo#x/y/z'), {page:HashPage, props:{a:'y',b:'z'}});
    });
    it('parse case senstive', function(){
      assert.deepEqual(mapper.fromUrl('/Home'), {page:NotFound, props:{url:'/Home'}});
    });
    it('parse NotFound', function(){
      assert.deepEqual(mapper.fromUrl('/foo/bar'), {page:NotFound, props:{url:'/foo/bar'}});
    });

  });


  describe('escaping', function()
  {
    var mapper = new UrlMapper({'/user/:name' : UserPage});

    it('generate', function(){
      assert.equal('/user/x%2Fy', mapper.toUrl({page:UserPage, props:{name:'x/y'}}));
    })

    it('parse', function(){
      assert.equal('x/y', mapper.fromUrl('/user/x%2Fy').props.name);
    })

  });


  describe('error conditions', function()
  {
    var mapper = new UrlMapper({'/user/:name' : UserPage});
    it('url not match any page', function(){
      assert.ok(!mapper.fromUrl('/notUser'));
    });
    it('bad url not parsed', function(){
      assert.ok(!mapper.fromUrl('/user/x%ZZy'));
    });
    it('toUrl() with bad props', function(){
      assert.throws(()=>mapper.toUrl({page:UserPage, props:{}}));
    })

    it('toUrl with unknown page', function(){
      function NewPage(){};
      assert.throws(()=>mapper.toUrl({page:NewPage, props:{name:'cat'}}))
    })


  });


}); // describe('UrlMapper Test'
