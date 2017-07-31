'use strict';
const Async = require('async');
const internals = {};

internals.applyRoutes = function (server, next) {

  //noinspection JSAnnotator
  server.route({
    method: 'GET',
    path: '/admin',
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
        admins: function (callback) {

          const injectRequest = {
            method: 'GET',
            url: '/api/admins',
            credentials: request.auth.credentials
          };

          server.inject(injectRequest, (res) => {

            callback(null,res);
          });
        },
        users: function (callback) {

          const injectRequest = {
            method: 'GET',
            url: '/api/users',
            credentials: request.auth.credentials
          };

          server.inject(injectRequest, (res) => {

            callback(null,res);
          });
        }
      }, (err, result) => {

        reply.view('admin', {
          user: request.auth.credentials.user,
          admins: result.admins.result,
          users: result.users.result
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
  name: 'admin/index',
  dependencies: 'visionary'
};

