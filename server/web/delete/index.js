'use strict';
const Async = require('async');
const User = require('../../models/user');

const internals = {};

internals.applyRoutes = function (server, next) {

  //noinspection JSAnnotator
  server.route({
    method: 'GET',
    path: '/delete',
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
        users: function (callback) {

          User.find({}, callback);
        }
      }, (err, result) => {

        reply.view('delete', {
          user: request.auth.credentials.user
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
  name: 'delete/index',
  dependencies: 'visionary'
};

