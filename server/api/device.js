'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Device = server.plugins['hapi-mongo-models'].Device;

  server.route({
    method: 'GET',
    path: '/device',
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

      Device.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
    });
    }
  });

  server.route({
    method: 'GET',
    path: '/device/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Device.findById(request.params.id, (err, device) => {

        if (err) {
          return reply(err);
        }

        if (!device) {
        return reply(Boom.notFound('Document not found.'));
      }

      reply(device);
    });
    }
  });

  server.route({
    method: 'POST',
    path: '/device',
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

      Device.create(
        request.payload.name,
        request.payload.description,
        request.payload.userId,
        (err, device) => {

        if (err) {
          return reply(err);
        }
        return reply(device);
    });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/device/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Device.findByIdAndDelete(request.params.id, (err, device) => {

        if (err) {
          return reply(err);
        }

        if (!device) {
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
  name: 'device'
};
