'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Feature = server.plugins['hapi-mongo-models'].Feature;

  server.route({
    method: 'GET',
    path: '/feature',
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

      Feature.pagedFind(query, fields, sort, limit, page, function (err, results) {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/feature/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Feature.findById(request.params.id, (err, feature) = > {

        if (err) {
          return reply(err);
        }

        if (
      !feature
      )
      {
        return reply(Boom.notFound('Document not found.'));
      }

      reply(feature);
    })
      ;
    }
  });

  server.route({
    method: 'POST',
    path: '/feature',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          annotationIds: Joi.array().items(Joi.string()), /*Joi.array().items(Annotation.schema),*/
          description: Joi.string().optional(),
          role: Joi.string().required(),
        }
      }
    },
    handler: function (request, reply) {

      Feature.create(
        request.payload.annotationIds,
        request.payload.name,
        request.payload.description,
        request.payload.role,
        request.auth.credentials.user._id.toString(),

        function (err, feature) {

          if (err) {
            return reply(err);
          }
          return reply(feature);
        });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/feature/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Feature.findByIdAndDelete(request.params.id, function (err, feature) {
        if (err) {
          return reply(err);
        }

        if (!feature) {
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
  name: 'feature'
};
