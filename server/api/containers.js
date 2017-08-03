'use strict';
const Async = require('async');
const Boom = require('boom');
const Joi = require('joi');
const ObjectID = require('mongo-models').ObjectId;

const internals = {};

internals.applyRoutes = function (server, next) {

  const Container = server.plugins['hapi-mongo-models'].Container;
  const Parameter = server.plugins['hapi-mongo-models'].Parameter;

  server.route({
    method: 'GET',
    path: '/container',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        query: {
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1)
        }
      }
    },
    handler: function (request, reply) {

      const query = {};
      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;

      Container.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/container/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Container.findById(request.params.id, (err, container) => {

        if (err) {
          return reply(err);
        }

        if (!container) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(container);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/container',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: Container.payload
      }
    },

    handler: function (request, reply) {

      Async.auto({
        parameters: function (callback) {

          if(request.payload.parameters) {
            var parameters = [];
            Async.each(request.payload.parameters, function(parameter, callback) {

              Parameter.create(
                parameter.name,
                request.auth.credentials.user._id.toString(),
                null, //bio-design ID
                parameter.value,
                parameter.variable,
                parameter.units,
                (err, result) => {
                  parameters.push(result);
                  callback();
                });
            }, function(err) {

              if( err ) {
                callback(err);
              } else {
                callback(null,parameters.map(function(a) {return a._id.toString();}));
              }
            });
          } else {
            return callback();
          }
        },
        container: ['parameters', function (results, callback) {

          Container.create(
            request.payload.name,
            request.payload.description,
            request.auth.credentials.user._id.toString(),
            results.parameters,
            request.payload.type,
            request.payload.coordinates,
            callback);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        return reply(results.container);
      });
    }
  });

  server.route({
    method: 'PUT',
    path: '/container/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: Container.payload
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          name: request.payload.name,
          description: request.payload.description,
          type: request.payload.type,
          parameters: request.payload.parameters,
          coordinates: request.payload.coordinates,
        }
      };

      Container.findByIdAndUpdate(id, update, (err, container) => {

        if (err) {
          return reply(err);
        }

        if (!container) {
          return reply(Boom.notFound('Container not found.'));
        }

        reply(container);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/container/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Async.auto({
        container: function (callback) {

          Container.findOne({_id: ObjectID(request.params.id)}, callback);
        },
        parameters: ['container', function (results, callback) {

          if(results.container.parameterIds) {
            var ids = results.container.parameterIds.map(function(id) { return ObjectID(id); });
            Parameter.find({_id: {$in: ids}}, callback);
          } else {
            callback(null, []);
          }
        }],
        deleteParameters: ['parameters', function (results, callback) {

          Async.each(results.parameters, function(parameter, callback) {

            Parameter.delete(parameter,callback);
          }, (err) => {

            if(err) {
              callback(err);
            }
            callback(null,null);
          });
        }],
        deleteContainer: ['parameters', function (results, callback) {

          Container.delete(results.container, callback);
        }]
      }, (err, results) => {
        if(err) {
          reply(err);
        }
        reply({message: 'success'});
      });
    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'container'
};
