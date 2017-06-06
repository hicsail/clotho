'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const CompositeModule = server.plugins['hapi-mongo-models'].CompositeModule;

  server.route({
    method: 'GET',
    path: '/composite-module',
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

      CompositeModule.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/composite-module/{id}',
    config: {
      auth: {
        strategy: 'simple'
      }
    },
    handler: function (request, reply) {

      CompositeModule.findById(request.params.id, (err, composite-module) => {

        if (err) {
          return reply(err);
        }

        if (!composite-module) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(composite-module);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/composite-module',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          role: Joi.object(),
          subModules: Joi.object(),
          userId: Joi.string().required(),
        }
      }
    },
    handler: function (request, reply) {

      Annotation.create(
        request.payload.name,
        request.payload.description,
        request.payload.role,
        request.payload.subModules,
        request.auth.credentials.user._id.toString(),

        (err, composite-module) => {

          if (err) {
            return reply(err);
          }
          return reply(composite-module);
        });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/composite-module/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      CompositeModule.findByIdAndDelete(request.params.id, (err, composite-module) => {

        if (err) {
          return reply(err);
        }

        if (!composite-module) {
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
  name: 'composite-module'
};
