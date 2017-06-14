'use strict';
const fs = require('fs');
const Path = require('path');
const internals = {};

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/api/docs',
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
      if(request.auth.isAuthenticated) {
        user = request.auth.credentials.user;
      }
      return reply.view('docs',{user: user});
    }
  });

  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'documentation',
  dependencies: 'visionary'
};
