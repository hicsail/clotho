'use strict';
const Async = require('async');
const Application = require('../../models/application');

const internals = {};

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/application',
    config: {
      auth: {
        strategy: 'session',
        scope: 'admin'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: '/login',
        }
      }
    },
    handler: function (request, reply) {

      Async.auto({
        apps: function (callback) {

          Application.pagedFind({},null,'name',20,1,callback);
        }
      }, (err, result) => {

        reply.view('application', {
          user: request.auth.credentials.user,
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


exports.register.attributes = {
  name: 'application/index',
  dependencies: 'visionary'
};

