
var chai = require('chai'),
    expect = chai.expect,
    argsToArray = Function.prototype.call.bind(Array.prototype.slice),
    exctrl = require('../.');

describe('exctrl', function () {
  var mockApp = null;

  beforeEach(function () {
    mockApp = {
      routes: [],
      add: function (method, args) {
        args = argsToArray(args);
        var url = args.shift(),
            handler = args.pop(),
            middlewares = args;
        this.routes.push({method: method, url: url, middlewares: middlewares, handler: handler});
      },
      get: function () {
        if (arguments.length === 1 && arguments[0] === 'env') {
          return 'test';
        }
        this.add('get', arguments);
      },
      post: function () {
        this.add('post', arguments);
      },
      put: function () {
        this.add('put', arguments);
      },
      delete: function () {
        this.add('delete', arguments);
      },
      head: function () {
        this.add('head', arguments);
      }
    };
  });

  describe('mount', function () {
    it('should use controller.name as mount point, if no name is given', function () {
      var controller = {
        name: 'user',
        get: function () {}
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(1);
      expect(mockApp.routes[0].url).to.equal('/user');
    });

    it('should use controller.name as mount point even though a name is given', function () {
      var controller = {
        name: 'super-user',
        get: function () {}
      };
      exctrl.bind(mockApp);
      exctrl.mount('user', controller);
      expect(mockApp.routes).to.have.length(1);
      expect(mockApp.routes[0].url).to.equal('/super-user');
    });

    it('should use given name as mount point', function () {
      var controller = {
        get: function () {}
      };
      exctrl.bind(mockApp);
      exctrl.mount('user', controller);
      expect(mockApp.routes).to.have.length(1);
      expect(mockApp.routes[0].url).to.equal('/user');
    });

    it('should mount actions with http method names directly to mount point, with correct method', function () {
      var controller = {
        name: 'user',
        get: function () {},
        post: function () {},
        put: function () {},
        delete: function () {},
        head: function () {}
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(5);
      expect(mockApp.routes[0].method).to.equal('get');
      expect(mockApp.routes[1].method).to.equal('post');
      expect(mockApp.routes[2].method).to.equal('put');
      expect(mockApp.routes[3].method).to.equal('delete');
      expect(mockApp.routes[4].method).to.equal('head');
      expect(mockApp.routes[0].url).to.equal('/user');
      expect(mockApp.routes[1].url).to.equal('/user');
      expect(mockApp.routes[2].url).to.equal('/user');
      expect(mockApp.routes[3].url).to.equal('/user');
      expect(mockApp.routes[4].url).to.equal('/user');
    });

    it('should mount CRUD named actions as their http equivalents with params', function () {
      var controller = {
        name: 'user',
        create: function () {},
        read: function () {},
        update: function () {},
        del: function () {}
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(4);
      expect(mockApp.routes[0].method).to.equal('post');
      expect(mockApp.routes[1].method).to.equal('get');
      expect(mockApp.routes[2].method).to.equal('put');
      expect(mockApp.routes[3].method).to.equal('delete');
      expect(mockApp.routes[0].url).to.equal('/user');
      expect(mockApp.routes[1].url).to.equal('/user/:id');
      expect(mockApp.routes[2].url).to.equal('/user/:id');
      expect(mockApp.routes[3].url).to.equal('/user/:id');
    });

    it('should mount `index` action as a http get route, without params', function () {
      var controller = {
        name: 'user',
        index: function () {}
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(1);
      expect(mockApp.routes[0].method).to.equal('get');
      expect(mockApp.routes[0].url).to.equal('/user');
    });

    it('should mount `search` action as a http get route, without params', function () {
      var controller = {
        name: 'user',
        search: function () {}
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(1);
      expect(mockApp.routes[0].method).to.equal('get');
      expect(mockApp.routes[0].url).to.equal('/user');
    });

    it('should mount `list` action as a http get route, without params', function () {
      var controller = {
        name: 'user',
        list: function () {}
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(1);
      expect(mockApp.routes[0].method).to.equal('get');
      expect(mockApp.routes[0].url).to.equal('/user');
    });

    it('should mount any other action, not starting with a http method name, as a http get route at the mount point', function () {
      var controller = {
        name: 'user',
        friend: function () {}
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(1);
      expect(mockApp.routes[0].method).to.equal('get');
      expect(mockApp.routes[0].url).to.equal('/user/friend');
    });

    it('should mount an action starting with a http method name as a route with correct http method at the mount point', function () {
      var controller = {
        name: 'user',
        postFriend: function () {}
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(1);
      expect(mockApp.routes[0].method).to.equal('post');
      expect(mockApp.routes[0].url).to.equal('/user/friend');
    });

    it('should dasherize the URL part of the action name', function () {
      var controller = {
        name: 'user',
        postFriendsAndOthers: function () {}
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(1);
      expect(mockApp.routes[0].method).to.equal('post');
      expect(mockApp.routes[0].url).to.equal('/user/friends-and-others');
    });

    it('should handle actions given with array syntax', function () {
      var controller = {
        name: 'user',
        post: [function () {}]
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(1);
      expect(mockApp.routes[0].method).to.equal('post');
      expect(mockApp.routes[0].url).to.equal('/user');
      expect(mockApp.routes[0].handler).to.be.a('function');
    });

    it('should add any provided parameters or URL chunks to actions given with array syntax', function () {
      var controller = {
        name: 'user',
        postFriend: [':name', function () {}],
        get: [':id', 'friends', function () {}]
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(2);
      expect(mockApp.routes[0].method).to.equal('post');
      expect(mockApp.routes[1].method).to.equal('get');
      expect(mockApp.routes[0].url).to.equal('/user/friend/:name');
      expect(mockApp.routes[1].url).to.equal('/user/:id/friends');
      expect(mockApp.routes[0].handler).to.be.a('function');
      expect(mockApp.routes[1].handler).to.be.a('function');
    });

    it('should add any provided middleware to actions given with array syntax', function () {
      var middleware = function () {};
      var controller = {
        name: 'user',
        get: [':id', middleware, 'friends', function () {}]
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(1);
      expect(mockApp.routes[0].method).to.equal('get');
      expect(mockApp.routes[0].url).to.equal('/user/:id/friends');
      expect(mockApp.routes[0].handler).to.be.a('function');
      expect(mockApp.routes[0].middlewares).to.have.length(1);
      expect(mockApp.routes[0].middlewares[0]).to.equal(middleware);
    });

    it('should not modify `this` for actions with array syntax', function () {
      var controller = {
        name: 'user',
        get: [':id', function () {
          return this.post();
        }],
        post: function () {
          return 'post';
        }
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(2);
      expect(mockApp.routes[0].method).to.equal('get');
      expect(mockApp.routes[1].method).to.equal('post');
      expect(mockApp.routes[0].handler).to.be.a('function');
      expect(mockApp.routes[1].handler).to.be.a('function');
      expect(mockApp.routes[0].handler()).to.equal('post');
    });

    it('should handle more advanced action names', function () {
      var controller = {
        name: 'user',
        "get/:id/friends": function () {},
        "get/:id/groups": function () {},
        "post/:id/friends": function () {}
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(3);
      expect(mockApp.routes[0].method).to.equal('get');
      expect(mockApp.routes[1].method).to.equal('get');
      expect(mockApp.routes[2].method).to.equal('post');
      expect(mockApp.routes[0].url).to.equal('/user/:id/friends');
      expect(mockApp.routes[1].url).to.equal('/user/:id/groups');
      expect(mockApp.routes[2].url).to.equal('/user/:id/friends');
    });

    it('should handle underscored action names', function () {
      var controller = {
        name: 'user',
        close_friends: function () {},
        post_friend: function () {}
      };
      exctrl.bind(mockApp);
      exctrl.mount(controller);
      expect(mockApp.routes).to.have.length(2);
      expect(mockApp.routes[0].method).to.equal('get');
      expect(mockApp.routes[1].method).to.equal('post');
      expect(mockApp.routes[0].url).to.equal('/user/close-friends');
      expect(mockApp.routes[1].url).to.equal('/user/friend');
    });
  });

  describe('load', function () {
    it('should mount all controllers matching given pattern', function () {
      exctrl.bind(mockApp);
      exctrl.load({pattern: __dirname + '/controllers/*.js'});
      expect(mockApp.routes).to.have.length(3);
    });

    it('should mount `home` controller as root', function () {
      exctrl.bind(mockApp);
      exctrl.load({pattern: __dirname + '/controllers/*.js'});
      expect(mockApp.routes).to.have.length(3);
      expect(mockApp.routes[0].url).to.equal('/');
    });

    it('should mount all controllers matching given pattern at given prefix', function () {
      exctrl.bind(mockApp);
      exctrl.load({pattern: __dirname + '/controllers/*.js', prefix: 'api'});
      expect(mockApp.routes).to.have.length(3);
      expect(mockApp.routes[0].url).to.equal('/api');
      expect(mockApp.routes[1].url).to.equal('/api/user/:id');
      expect(mockApp.routes[2].url).to.equal('/api/user');
    });

    it('should be able to extract controller name from filename via provided regexp', function () {
      exctrl.bind(mockApp);
      exctrl.load({pattern: __dirname + '/other_controllers/*.js', nameRegExp: /([^\/\\]+).ctrl.js$/, prefix: 'api'});
      expect(mockApp.routes).to.have.length(1);
      expect(mockApp.routes[0].url).to.equal('/api');
    });

    it('should be able to nest `bind` and `load`', function () {
      exctrl.bind(mockApp)
            .load({pattern: __dirname + '/other_controllers/*.js', nameRegExp: /([^\/\\]+).ctrl.js$/, prefix: 'api'});
      expect(mockApp.routes).to.have.length(1);
      expect(mockApp.routes[0].url).to.equal('/api');
    });
  });

});
