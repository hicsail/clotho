'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Strain = server.plugins['hapi-mongo-models'].Strain;

  server.route({
    method: 'GET',
    path: '/strain',
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

      Strain.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/strain/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Strain.findById(request.params.id, (err, strain) => {

        if (err) {
          return reply(err);
        }

        if (!strain) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(strain);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/strain',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().required()
        }
      }
    },

    handler: function (request, reply) {

      Strain.create(
        request.payload.name,
        request.auth.credentials.user._id.toString(),
        request.payload.description,
        (err, strain) => {

          if (err) {
            return reply(err);
          }
          return reply(strain);

        });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/strain/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Strain.findByIdAndDelete(request.params.id, (err, strain) => {

        if (err) {
          return reply(err);
        }

        if (!strain) {
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
  name: 'strain'
};
