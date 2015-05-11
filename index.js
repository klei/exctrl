
/**
 * DEPENDENCIES
 */
var glob = require('glob'),
    path = require('path'),
    _ = require('underscore.string');

/**
 * CONSTANTS
 */
var MAGIC_ACTIONS = {
      'create': {method: 'post', args: null},
      'read': {method: 'get', args: [':id']},
      'update': {method: 'put', args: [':id']},
      'del': {method: 'delete', args: [':id']},
      'search': {method: 'get', args: null},
      'index': {method: 'get', args: null},
      'list': {method: 'get', args: null}
    };

/**
 * PUBLIC API
 */

/**
 * Attach an express.js app
 *
 * @param {Function} app
 */
exports.bind = function (app) {
  this.app = app;
  return this;
};

/**
 * Automatic router middleware
 *
 * @param {Function} app An express app
 */
exports.load = function (app, options) {
  var self = this;

  if (typeof app === 'object' && typeof options !== 'object') {
    options = app;
    app = null;
  }

  if (app) {
    this.bind(app);
  }

  options = options || {};

  if (!options.pattern) {
    throw new Error('You must specify a controller matching pattern! E.g. \'controllers/*.js\'');
  }

  // Make this sync because we want this to be executed where we intend:
  glob.sync(options.pattern).forEach(function (file) {
    var controller = require(file),
        controllerName = getControllerName(file, options.nameRegExp),
        mountPoint = stripUnwantedSlashes(options.prefix) + '/' + (controllerName.toLowerCase() !== 'home' ? controllerName : '');

    self.mount(mountPoint, controller);
  });

  return this;
};

/**
 * Mount a given controller
 *
 * @param {String} name    Used as mount point
 * @param {Object} controller
 */
exports.mount = function (name, controller) {
  if (!this.app) {
    throw new Error('An Express.js app must be bound to exctrl before mounting a controller!');
  }

  if (typeof name === 'object' && typeof controller === 'undefined') {
    controller = name;
    name = null;
  }

  if (typeof controller.name === 'string') {
    name = controller.name;
  }

  var app = this.app;

  Object.keys(controller).forEach(function (action) {

    if (action === 'name' && controller[action] === name) {
      return;
    }

    var magic = MAGIC_ACTIONS[action] || {},
          route = {
            method: magic.method || getMethod(action) || 'get',
            url: [],
            args: magic.args || [],
            handler: controller[action]
          };

      if (name) {
        route.url.push(stripUnwantedSlashes(name));
      }

      if (action === 'init') {
        controller[action](app, route.url.join('/'));
        return;
      }

      if (!magic.method) {
        // Custom actions (i.e. not magic) needs its name without HTTP method added to the url:
        arrayAdd(route.url, getUrlPart(action));
      }

      // Is the action an array?
      if (Array.isArray(route.handler)) {
        if (route.handler.length > 1) {
          // All preceeding elements in the array are url params/chunks/arguments e.g. ':id':
          route.args = route.handler.splice(0, route.handler.length - 1);
        }
        // The last element in the array is the real handler:
        route.handler = route.handler.pop();
      }

      if (typeof route.handler !== 'function') {
        throw new Error('Bad handler type for action: ' + name + ':' + action + ', expected: \'function\', but was: \'' + typeof(route.handler) + '\'');
      }

      // Add the url params/chunks/arguments to the route.url:
      arrayAdd(route.url, getUrlChunks(route.args));

      if (app.get('env') === 'development') {
        console.log('CONTROLLER-ACTION:ADD', route.method.toUpperCase() + ' ' + getUrl(route.url));
      }

      // Add the route to app:
      app[route.method].apply(app,
        [getUrl(route.url)]
        .concat(getMiddlewares(route.args))
        .concat(route.handler.bind(controller))
      );
  });

  return this;
};

/**
 * PRIVATE API
 */

/**
 * Add one array's elements to another
 *
 * @param {Array} dest
 * @param {Array} src
 */
function arrayAdd (dest, src) {
  dest.push.apply(dest, src);
}

/**
 * Get controller name
 *
 * Gets the controller name from a filename
 * If `extractorRegExp` is provided and it matches
 * the filename, the first match group will be returned.
 * Otherwise the filename without extension will be returned.
 *
 * Example 1:
 *  file: /var/tmp/super.controller.js
 *  extractorRegExp: /([^\/\\]+).controller.js$/
 *  Returns: 'super'
 *
 * Example 2:
 *  file: /var/tmp/controllers/super.js
 *  extractorRegExp: NULL
 *  Returns: 'super'
 *
 * @param {String} file
 * @param {RegExp} extractorRegExp
 * @returns {String}
 */
function getControllerName (file, extractorRegExp) {
  var name = extractorRegExp ? file.match(extractorRegExp)[1] : null;
  return name || path.basename(file).slice(0, -path.extname(file).length);
}

/**
 * Get an URL from an array of chunks
 *
 * Joins the chunks with '/' and prepends it as well
 *
 * @param {Array} urlChunks
 * @returns {String}
 */
function getUrl (urlChunks) {
  return '/' + urlChunks.join('/');
}

/**
 * Get all middlewares
 *
 * Returns all middlewares, i.e. functions, in an array
 *
 * @param {Array} arr
 * @returns {Array}
 */
function getMiddlewares (arr) {
  return arr.filter(function (e) {
    return typeof e === 'function';
  });
}

/**
 * Get all url chunks
 *
 * Returns all url chunks, i.e. not functions, in an array
 *
 * @param {Array} arr
 * @returns {Array}
 */
function getUrlChunks (arr) {
  return arr.filter(function (e) {
    return typeof e !== 'function';
  });
}

/**
 * Removes leading and trailing slashes in url
 *
 * @param {String} url
 * @returns {String}
 */
function stripUnwantedSlashes (url) {
  return _.trim(url || '', '/');
}

/**
 * Get HTTP method from action name
 *
 * Expects action name to be camelCased, e.g:
 *   - postThing -> post
 *   - getSuperThingy -> get
 *   - weirdAction -> NULL
 *
 * @param {String} action
 * @returns {String}
 */
function getMethod (action) {
  var method = action.split(/[^a-z]/)[0];
  if (['post', 'head', 'get', 'delete', 'put', 'trace', 'options', 'patch'].indexOf(method) >= 0) {
    return method;
  }
  return null;
}

/**
 * Get url part from action name
 *
 * Expects action name to be camelCased, e.g:
 *   - postThing -> thing
 *   - getSuperThingy -> super-thingy
 *   - myAction -> my-action
 *
 * @param {String} action
 * @returns {String}
 */
function getUrlPart (action) {
  var method = getMethod(action);
  if (method) {
    action = action.slice(method.length);
  }
  return stripUnwantedSlashes(action).split('/').filter(function (chunk) { return !!chunk; })
    .map(function (chunk) {
      if (chunk.indexOf(':') < 0) {
        return _.ltrim(_.dasherize(chunk), '-');
      }
      return chunk;
    });
}
