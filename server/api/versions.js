'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Version = server.plugins['hapi-mongo-models'].Version;

  server.route({
    method: 'GET',
    path: '/version',
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

      Version.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/version/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Version.findById(request.params.id, (err, version) => {

        if (err) {
          return reply(err);
        }

        if (!version) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(version);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/version',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          userId: Joi.string().required(),
          objectId: Joi.string().required(),
          versionNumber: Joi.number(),
          collectionName: Joi.string(),
          time: Joi.date(),
          replacementVersionId: Joi.string().optional(),
          description: Joi.string().optional,
          application: Joi.string()
        }
      }
    },

    handler: function (request, reply) {

      Version.create(
        request.payload.userId,
        request.payload.objectId,
        request.auth.credentials.user._id.toString(),
        request.payload.versionNumber,
        request.payload.collectionName,
        request.payload.time,
        request.payload.replacementVersionId,
        request.payload.description,
        request.payload.application,
        (err, version) => {

          if (err) {
            return reply(err);
          }
          return reply(version);
        });
    }
  });

  server.route({
    method: 'PUT',
    path: '/version/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          userId: Joi.string().required(),
          objectId: Joi.string().required(),
          versionNumber: Joi.number(),
          collectionName: Joi.string(),
          time: Joi.date(),
          replacementVersionId: Joi.string().optional(),
          description: Joi.string().optional,
          application: Joi.string()
        }
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          userId: request.payload.userId,
          objectId: request.payload.objectId,
          versionNumber: request.payload.versionNumber,
          collectionName: request.payload.collectionName,
          time: request.payload.time,
          replacementVersionId: request.payload.replacementVersionId,
          description: request.payload.description,
          application: request.payload.application
        }
      };

      Version.findByIdAndUpdate(id, update, (err, version) => {

        if (err) {
          return reply(err);
        }

        if (!version) {
          return reply(Boom.notFound('Version not found.'));
        }

        reply(version);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/version/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Version.findByIdAndDelete(request.params.id, (err, version) => {

        if (err) {
          return reply(err);
        }

        if (!version) {
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
  name: 'version'
};
