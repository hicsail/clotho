'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Part = server.plugins['hapi-mongo-models'].Part;

  server.route({
    method: 'GET',
    path: '/part',
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

      Part.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/part/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Part.findById(request.params.id, (err, part) => {

        if (err) {
          return reply(err);
        }

        if (!part) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(part);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/part',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          _id: Joi.object(),
          format: Format.schema,
          assemblyIds: Joi.array().items(Joi.string()), /*Joi.array().items(Assembly.schema),*/
          sequence: Sequence.schema,
          isForwardOrientation: Joi.boolean(),
          parentPartId: Joi.string(),
          name: Joi.string().required(),
          description: Joi.string(),
          userId: Joi.string().required()
        }
      }
    },

    handler: function (request, reply) {

      Part.create(
        request.payload.name,
        request.payload.description,
        request.payload.sequence,
        request.payload.userId,
        request.auth.credentials.user._id.toString(),
        (err, part) => {

          if (err) {
            return reply(err);
          }
          return reply(part);
        });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/part/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Part.findByIdAndDelete(request.params.id, (err, part) => {

        if (err) {
          return reply(err);
        }

        if (!part) {
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
  name: 'part'
};
