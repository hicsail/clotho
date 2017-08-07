'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Assembly = server.plugins['hapi-mongo-models'].Assembly;

  server.route({
    method: 'GET',
    path: '/assembly',
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

      Assembly.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/assembly/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Assembly.findById(request.params.id, (err, assembly) => {

        if (err) {
          return reply(err);
        }

        if (!assembly) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(assembly);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/assembly',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          subBioDesignIds: Joi.array().items(Joi.string()),
          superSubPartId: Joi.string()
        }
      }
    },

    handler: function (request, reply) {

      Assembly.create(
        request.payload.subBioDesignIds,
        request.auth.credentials.user._id.toString(),
        request.payload.superSubPartId,
        (err, assembly) => {

          if (err) {
            return reply(err);
          }
          return reply(assembly);
        });
    }
  });

  server.route({
    method: 'PUT',
    path: '/assembly/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          subBioDesignIds: Joi.array().items(Joi.string()),
          superSubPartId: Joi.string()
        }
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          subBioDesignIds: request.payload.subBioDesignIds,
          superSubPartId: request.payload.superSubPartId
        }
      };

      Assembly.findByIdAndUpdate(id, update, (err, assembly) => {

        if (err) {
          return reply(err);
        }

        if (!assembly) {
          return reply(Boom.notFound('Assembly not found.'));
        }

        reply(assembly);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/assembly/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Assembly.findByIdAndDelete(request.params.id, (err, assembly) => {

        if (err) {
          return reply(err);
        }

        if (!assembly) {
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
  name: 'assembly'
};
