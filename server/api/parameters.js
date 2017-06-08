'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Parameter = server.plugins['hapi-mongo-models'].Parameter;

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
          value: Joi.number().required(),
          variable: Joi.object().required(), // This was originally a Variable object/a ShareableObjBase.
          bioDesignId: Joi.string().optional()
        }
      }
    },

    handler: function (request, reply) {

      Parameter.create(
        request.payload.value,
        request.payload.variable,
        request.payload.bioDesignId,
        (err, parameter) => {

          if (err) {
            return reply(err);
          }
          return reply(parameter);
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

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'parameter'
};
