'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const BasicModule = server.plugins['hapi-mongo-models'].BasicModule;

  server.route({
    method: 'GET',
    path: '/basic-module',
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

      BasicModule.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/basic-module/{id}',
    config: {
      auth: {
        strategy: 'simple'
      }
    },
    handler: function (request, reply) {

      BasicModule.findById(request.params.id, (err, basic-module) => {

        if (err) {
          return reply(err);
        }

        if (!basic-module) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(basic-module);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/basic-module',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          feature: Joi.object(),
          userId: Joi.string().required(),
        }
      }
    },
    handler: function (request, reply) {

      Annotation.create(
        request.payload.name,
        request.payload.description,
        request.payload.feature,
        request.auth.credentials.user._id.toString(),

        (err, basic-module) => {

          if (err) {
            return reply(err);
          }
          return reply(basic-module);
        });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/basic-module/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      BasicModule.findByIdAndDelete(request.params.id, (err, basic-module) => {

        if (err) {
          return reply(err);
        }

        if (!basic-module) {
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
  name: 'basic-module'
};
