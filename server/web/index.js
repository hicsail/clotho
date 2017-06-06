'use strict';
const Path = require('path');

exports.register = function (server, options, next) {

  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {

      return reply.view('index');
    }
  });

  server.route({
    method: 'GET',
    path: '/public/{file*2}',
    handler: function (request, reply) {

      return reply.file(Path.join(__dirname, './public/' + request.params.file));
    }
  });

  server.route({
    method: 'GET',
    path: '/register',
    handler: function (request, reply) {

      return reply.view('register');
    }
  });

  next();
};


exports.register.attributes = {
  name: 'home',
  dependencies: 'visionary'
};
