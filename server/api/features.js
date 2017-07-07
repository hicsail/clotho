'use strict';

const Boom = require('boom');
const Joi = require('joi');
const ObjectID = require('mongo-models').ObjectID;

const internals = {};

internals.applyRoutes = function (server, next) {

  const Feature = server.plugins['hapi-mongo-models'].Feature;
  const Role = server.plugins['hapi-mongo-models'].Role;

  server.route({
    method: 'GET',
    path: '/feature',
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

      Feature.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/feature/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Feature.findById(request.params.id, (err, feature) => {

        if (err) {
          return reply(err);
        }

        if (!feature) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(feature);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/feature',
    config: {
      auth: {
        strategy: 'simple'
      },
      pre: [{
        assign: 'checkrole',
        method: function (request, reply) {
          var role = request.payload.role;
          if (role !== undefined && role !== null) {
            Role.checkValidRole(role, (err, results) => {

              if (err || !results) {
                return reply(Boom.badRequest('Role invalid.'));
              } else {
                reply(true);
              }
            });
          } else {
            reply(true);
          }
        }
      }],
      validate: {
        payload: {
          name: Joi.string().required(),
          displayId: Joi.string().optional(),
          description: Joi.string().optional(),
          role: Joi.string().uppercase().required(),
          annotationId: Joi.string().required(),
          moduleId: Joi.string()
        }
      }
    },
    handler: function (request, reply) {

      Feature.create(
        request.payload.name,
        request.payload.description,
        request.auth.credentials.user._id.toString(),
        request.payload.displayId,
        request.payload.role,
        request.payload.annotationId,
        request.payload.moduleId,
        (err, feature) => {

          if (err) {
            return reply(err);
          }
          return reply(feature);
        }
      );
    }
  });

  server.route({
    method: 'PUT',
    path: '/feature/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      pre: [{
        assign: 'checkrole',
        method: function (request, reply) {
          var role = request.payload.role;
          if (role !== undefined && role !== null) {
            Role.checkValidRole(role, (err, results) => {

              if (err || !results) {
                return reply(Boom.badRequest('Role invalid.'));
              } else {
                reply(true);
              }
            });
          } else {
            reply(true);
          }
        }
      }],
      validate: {
        payload: {
          name: Joi.string().required(),
          displayId: Joi.string().optional(),
          description: Joi.string().optional(),
          role: Joi.string().uppercase().required(),
          annotationId: Joi.string().required(),
          moduleId: Joi.string()
        }
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;

      const update = {
        $set: {
          name: request.payload.name,
          displayId: request.payload.displayId,
          description: request.payload.description,
          role: request.payload.role,
          annotationId: request.payload.annotationId,
          moduleId: request.payload.moduleId
        }
      };

      Feature.findOneAndUpdate({_id: ObjectID(id), $isolated: 1}, update, (err, feature) => {

        if (err) {
          return reply(err);
        }

        if (!feature) {
          return reply(Boom.notFound('Feature not found.'));
        }

        reply(feature);
      });
    }

  });

  server.route({
    method: 'DELETE',
    path: '/feature/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Feature.findByIdAndDelete(request.params.id, (err, feature) => {

        if (err) {
          return reply(err);
        }

        if (!feature) {
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
  name: 'feature'
};
