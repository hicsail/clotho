'use strict';
const internals = {};

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/login',
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

      return reply.view('login');
    }
  });

  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'login/index',
  dependencies: 'visionary'
};
