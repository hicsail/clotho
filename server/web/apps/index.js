'use strict';
const Async = require('async');
const Application = require('../../models/application');

const internals = {};

internals.applyRoutes = function (server, next) {

  //noinspection JSAnnotator
  server.route({
    method: 'GET',
    path: '/apps',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    },
    handler: function (request, reply) {

      var user = null;
      if (request.auth.isAuthenticated) {
        user = request.auth.credentials.user;
      }

      Async.auto({
        apps: function (callback) {

          Application.find({},callback);
        }
      }, (err, result) => {

        result.apps = chunkify(result.apps,Math.ceil(result.apps.length/3));
        while(result.apps[result.apps.length-1].length == 1) {
          result.apps[result.apps.length-1].push(null);
        }
        reply.view('apps', {
          user: user,
          apps: result.apps
        });
      });
    }
  });

  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};

function chunkify(a, n) {

  var len = a.length,
    out = [],
    i = 0,
    size;

  while (i < len) {
    size = Math.ceil((len - i) / n--);
    out.push(a.slice(i, i += size));
  }

  return out;
}


exports.register.attributes = {
  name: 'apps/index',
  dependencies: 'visionary'
};

