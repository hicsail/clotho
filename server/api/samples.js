'use strict';
const Async = require('async');
const Boom = require('boom');
const Joi = require('joi');
const ObjectID = require('mongo-models').ObjectId;

const internals = {};

internals.applyRoutes = function (server, next) {

  const Sample = server.plugins['hapi-mongo-models'].Sample;
  const Parameter = server.plugins['hapi-mongo-models'].Parameter;

  server.route({
    method: 'GET',
    path: '/sample',
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

      Sample.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/sample/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Sample.findById(request.params.id, (err, sample) => {

        if (err) {
          return reply(err);
        }

        if (!sample) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(sample);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/sample',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: Sample.payload
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
        sample: ['parameters', function (results, callback) {

          Sample.create(
            request.payload.name,
            request.payload.description,
            request.auth.credentials.user._id.toString(),
            request.payload.containerId,
            request.payload.bioDesignId,
            results.parameters,
            request.payload.parentSampleIds,
            callback);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        return reply(results.sample);
      });
    }
  });

  server.route({
    method: 'PUT',
    path: '/sample/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: Sample.payload
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

      Sample.findByIdAndUpdate(id, update, (err, sample) => {

        if (err) {
          return reply(err);
        }

        if (!sample) {
          return reply(Boom.notFound('Sample not found.'));
        }

        reply(sample);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/sample/{id}',
    config: {
      auth: {
        strategy: 'simple',
      },
      pre: [{
        assign: 'sample',
        method: function (request, reply) {

          Sample.findOne({_id: ObjectID(request.params.id)}, (err, sample) => {

            if (err) {
              return reply(err);
            }

            if (!sample) {
              return reply(Boom.notFound('Sample not found.'));
            }

            reply(sample);
          });
        }
      }]
    },
    handler: function (request, reply) {

      Async.auto({
        sample: function (callback) {

          Sample.findOne({_id: ObjectID(request.params.id)}, callback);
        },
        parameters: ['sample', function (results, callback) {

          if(results.sample.parameterIds) {
            var ids = results.sample.parameterIds.map(function(id) { return ObjectID(id); });
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
        deleteSample: ['parameters', function (results, callback) {

          Sample.delete(results.sample, callback);
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
  name: 'sample'
};
