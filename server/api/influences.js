'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Influence = server.plugins['hapi-mongo-models'].Influence;

  server.route({
    method: 'GET',
    path: '/influence',
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

      Influence.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
    });
    }
  });

  server.route({
    method: 'GET',
    path: '/influence/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Influence.findById(request.params.id, (err, influence) => {

        if (err) {
          return reply(err);
        }

        if (!influence) {
        return reply(Boom.notFound('Document not found.'));
      }

      reply(influence);
    });
    }
  });

  server.route({
    method: 'POST',
    path: '/influence',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          influencingFeature: Joi.string().required(),
          influencedFeature: Joi.string().required(),
          type: Joi.string().required(), // maybe use Joi.object.type()?


        }
      }
    },

    handler: function (request, reply) {

      Influence.create(
        request.payload.name,
        request.payload.description,
        request.payload.influencingFeature,
        request.payload.influencedFeature,
        request.payload.type,
        request.auth.credentials.user._id.toString(),
        (err, influence) => {

        if (err) {
          return reply(err);
        }
        return reply(influence);
    });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/influence/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Influence.findByIdAndDelete(request.params.id, (err, influence) => {

        if (err) {
          return reply(err);
        }

        if (!influence) {
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
  name: 'influence'
};
