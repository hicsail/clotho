'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Medium = server.plugins['hapi-mongo-models'].Medium;

  server.route({
    method: 'GET',
    path: '/medium',
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

      Medium.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/medium/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Medium.findById(request.params.id, (err, medium) => {

        if (err) {
          return reply(err);
        }

        if (!medium) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(medium);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/medium',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional()
        }
      }
    },

    handler: function (request, reply) {

      Medium.create(
        request.payload.name,
        request.payload.description,
        request.auth.credentials.user._id.toString(),
        (err, medium) => {

          if (err) {
            return reply(err);
          }
          return reply(medium);
        });
    }
  });

  server.route({
    method: 'PUT',
    path: '/medium/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
        }
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          name: request.payload.name,
          description: request.payload.description,
        }
      };

      Medium.findByIdAndUpdate(id, update, (err, medium) => {

        if (err) {
          return reply(err);
        }

        if (!medium) {
          return reply(Boom.notFound('Medium not found.'));
        }

        reply(medium);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/medium/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Medium.findByIdAndDelete(request.params.id, (err, medium) => {

        if (err) {
          return reply(err);
        }

        if (!medium) {
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
  name: 'medium'
};
