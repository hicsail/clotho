'use strict';

const Boom = require('boom');
const Joi = require('joi');
const ObjectID = require('mongo-models').ObjectID;

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
          type: Joi.string().valid('REPRESSION', 'ACTIVATION').required(),
          influencedFeature: Joi.string().required(),
          influencingFeature: Joi.string().required()
        }
      }
    },

    handler: function (request, reply) {

      Influence.create(
        request.payload.name,
        request.payload.description,
        request.auth.credentials.user._id.toString(),
        request.payload.type,
        request.payload.influencedFeature,
        request.payload.influencingFeature,
        (err, influence) => {

          if (err) {
            return reply(err);
          }
          return reply(influence);
        });
    }
  });

  server.route({
    method: 'PUT',
    path: '/influence/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          type: Joi.string().valid('REPRESSION', 'ACTIVATION').required(),
          influencedFeature: Joi.string().required(),
          influencingFeature: Joi.string().required()
        }
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          name: request.payload.name,
          description: request.payload.description,
          type: request.payload.type,
          influencedFeature: request.payload.influencedFeature,
          influencingFeature: request.payload.influencingFeature
        }
      };

      Influence.findOneAndUpdate({_id: ObjectID(id), $isolated: 1}, update, (err, influence) => {

        if (err) {
          return reply(err);
        }

        if (!influence) {
          return reply(Boom.notFound('Influence not found.'));
        }

        reply(influence);
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
