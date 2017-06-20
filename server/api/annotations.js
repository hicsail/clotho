'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Annotation = server.plugins['hapi-mongo-models'].Annotation;

  server.route({
    method: 'GET',
    path: '/annotation',
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

      Annotation.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/annotation/{id}',
    config: {
      auth: {
        strategy: 'simple'
      }
    },
    handler: function (request, reply) {

      Annotation.findById(request.params.id, (err, annotation) => {

        if (err) {
          return reply(err);
        }

        if (!annotation) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(annotation);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/annotation',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          sequenceId: Joi.string().required(),
          start: Joi.number().integer().positive().required(),
          end: Joi.number().integer().positive().required(),
          isForwardStrand: Joi.boolean().required()
        }
      }
    },
    handler: function (request, reply) {

      Annotation.create(
        request.payload.name,
        request.payload.description,
        request.auth.credentials.user._id.toString(),
        request.payload.sequenceId,
        request.payload.start,
        request.payload.end,
        request.payload.isForwardStrand,

        (err, annotation) => {

          if (err) {
            return reply(err);
          }
          return reply(annotation);
        });
    }
  });

  server.route({
    method: 'PUT',
    path: '/annotation/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          sequenceId: Joi.string().required(),
          start: Joi.number().integer().positive().required(),
          end: Joi.number().integer().positive().required(),
          isForwardStrand: Joi.boolean().required()
        }
      }
    },
    handler: function (request, reply) {

      const id= request.params.id;
      const update = {
        $set: {
          name: request.payload.name,
          description: request.payload.description,
          sequenceId: request.payload.sequenceId,
          start: request.payload.start,
          end: request.payload.end,
          isForwardStrand: request.payload.isForwardStrand
        }
      };

      Annotation.findByIdAndUpdate(id, update, (err, annotation) => {

        if (err) {
          return reply(err);
        }

        if (!annotation) {
          return reply(Boom.notFound('Annotation not found.'));
      }

      reply(annotation);
      });
    }

  });

  server.route({
    method: 'DELETE',
    path: '/annotation/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Annotation.findByIdAndDelete(request.params.id, (err, annotation) => {

        if (err) {
          return reply(err);
        }

        if (!annotation) {
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
  name: 'annotation'
};
