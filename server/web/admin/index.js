'use strict';
const Async = require('async');
const User = require('../../models/user');

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
        users: function (callback) {

          User.find({}, callback);
        }
      }, (err, result) => {
        
        reply.view('admin', {
          user: request.auth.credentials.user,
          users: result.users
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

