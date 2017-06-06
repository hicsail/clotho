'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const BigPart = server.plugins['hapi-mongo-models'].BigPart;

  server.route({
    method: 'GET',
    path: '/bigpart',
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

      BigPart.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
    });
    }
  });

  server.route({
    method: 'GET',
    path: '/bigpart/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      BigPart.findById(request.params.id, (err, bigpart) => {

        if (err) {
          return reply(err);
        }

        if (!bigpart) {
        return reply(Boom.notFound('Document not found.'));
      }

      reply(bigpart);
    });
    }
  });

  server.route({
    method: 'POST',
    path: '/bigpart',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().required(),
          userId: Joi.string().required()
        }
      }
    },

    handler: function(request, reply) {

      BigPart.create(
        request.payload.name,
        request.payload.description,
        request.payload.userId,
        (err, bigpart) => {

        if (err) {
          return reply(err);
        }
        return reply(bigpart);
    });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/bigpart/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      BigPart.findByIdAndDelete(request.params.id, (err, bigpart) => {

        if (err) {
          return reply(err);
        }

        if (!bigpart) {
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
  name: 'bigpart'
};
