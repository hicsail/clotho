'use strict';
const Async = require('async');
const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Parameter = server.plugins['hapi-mongo-models'].Parameter;
  const BioDesign = server.plugins['hapi-mongo-models'].BioDesign;
  const Sample = server.plugins['hapi-mongo-models'].Sample;

  server.route({
    method: 'GET',
    path: '/parameter',
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

      Parameter.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/parameter/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Parameter.findById(request.params.id, (err, parameter) => {

        if (err) {
          return reply(err);
        }

        if (!parameter) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(parameter);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/parameter',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          bioDesignId: Joi.string().optional(),
          value: Joi.number().required(),
          variable: Joi.string().required(),
          units: Joi.string().required()
        }
      }
    },

    handler: function (request, reply) {

      Parameter.create(
        request.payload.name,
        request.auth.credentials.user._id.toString(),
        request.payload.bioDesignId,
        request.payload.value,
        request.payload.variable,
        request.payload.units,
        (err, parameter) => {

          if (err) {
            return reply(err);
          }
          return reply(parameter);
        });
    }
  });

  server.route({
    method: 'PUT',
    path: '/parameter/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          bioDesignId: Joi.string().optional(),
          value: Joi.number().required(),
          variable: Joi.string().required()
        }
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          bioDesignId: request.payload.bioDesignId,
          value: request.payload.value,
          variable: request.payload.variable
        }
      };

      Parameter.findByIdAndUpdate(id, update, (err, parameter) => {

        if (err) {
          return reply(err);
        }

        if (!parameter) {
          return reply(Boom.notFound('Parameter not found.'));
        }

        reply(parameter);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/parameter/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Parameter.findByIdAndDelete(request.params.id, (err, parameter) => {

        if (err) {
          return reply(err);
        }

        if (!parameter) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply({message: 'Success.'});
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/parameter',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          limit: Joi.number().default(20),
          page: Joi.number().default(1),
          name: Joi.string().optional(),
          value: Joi.number().optional(),
          variable: Joi.string().optional(),
          units: Joi.string().optional(),
          type: Joi.string().allow('PART','DEVICE','SAMPLE')
        }
      }
    },
    handler: function (request, reply) {

      const query = {};
      const limit = request.query.limit;
      const page = request.query.page;

      if(request.payload.name) {
        query.name = { $regex: request.payload.name, $options: 'i'}
      }

      if(request.payload.variable) {
        query.variable = { $regex: request.payload.variable, $options: 'i'}
      }

      if(request.payload.units) {
        query.units = { $regex: request.payload.units, $options: 'i'}
      }

      if(request.payload.value) {
        query.value = request.payload.value
      }

      Async.auto({
        parameter: function(callback) {

          Parameter.pagedFind(query, null, null, limit, page, callback);
        },
        bioDesignId: ['parameter', function(results,callback) {

          let objectIDs = [];
          for(let parameter of results.parameter.data) {
            if(parameter.bioDesignId) {
              objectIDs.push(Parameter.ObjectID(parameter.bioDesignId));
            }
          }
          callback(null,objectIDs)
        }],
        parameterIds: ['parameter', function(results,callback) {

          let parameterIds = [];
          for(let parameter of results.parameter.data) {
            parameterIds.push(parameter._id.toString());
          }
          callback(null,parameterIds)
        }],
        parts: ['bioDesignId', function (results, callback) {

          if(!request.payload.type || request.payload.type == 'PART') {

            const query = {
              type: 'PART',
              _id: { $in: results.bioDesignId}
            };

            BioDesign.find(query,callback);
          } else {
            callback();
          }
        }],
        devices: ['bioDesignId', function (results, callback) {

          if(!request.payload.type || request.payload.type == 'DEVICE') {

            const query = {
              type: 'DEVICE',
              _id: { $in: results.bioDesignId}
            };

            BioDesign.find(query,callback);
          } else {
            callback();
          }
        }],
        samples: ['parameterIds', function (results, callback) {

          if(!request.payload.type || request.payload.type == 'SAMPLE') {

            const query = {
              parameterIds: { $in: results.parameterIds}
            };

            Sample.find(query,callback);
          } else {
            callback();
          }
        }],
        output: ['parts','devices','samples', function (results, callback) {

          let output = {
            parts: results.parts,
            devices: results.devices,
            samples: results.samples
          };

          callback(null, output);
        }]
      }, (err, results) => {

        if(err) {
          return reply(err);
        }

        reply(results.output);
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
  name: 'parameter'
};
