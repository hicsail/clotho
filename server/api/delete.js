'use strict';
const Async = require('async');
const Boom = require('boom');
const Joi = require('joi');
const AuthPlugin = require('../auth');
const Manifest = require('../../manifest');
const Path = require('path');


const internals = {};


internals.applyRoutes = function (server, next) {

  server.route({
    method: 'POST',
    path: '/delete',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {
      var plugins = Manifest.get('/registrations')
      for(var plugin of plugins) {
        if(plugin.plugin.register == 'hapi-mongo-models') {
          var models = plugin.plugin.options.models;
          for(var name in models) {
            var model = require(Path.join(__dirname,'../../',models[name]));
            model.deleteMany({toDelete: true}, (err, result) => {});
          }
          break;
        }
      }
      reply({message: 'success'})
    }
  });

  server.route({
    method: 'POST',
    path: '/undelete',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {
      var plugins = Manifest.get('/registrations')
      for(var plugin of plugins) {
        if(plugin.plugin.register == 'hapi-mongo-models') {
          var models = plugin.plugin.options.models;
          for(var name in models) {
            var model = require(Path.join(__dirname,'../../',models[name]));
            model.updateMany({toDelete: true}, {$unset: {toDelete: ""}}, (err,result) => {});
          }
          break;
        }
      }
      reply({message: 'success'})
    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'delete'
};
