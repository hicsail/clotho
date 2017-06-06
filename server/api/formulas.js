'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Formula = server.plugins['hapi-mongo-models'].Formula;

  server.route({
    method: 'GET',
    path: '/formula',
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

      Formula.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
    });
    }
  });

  server.route({
    method: 'GET',
    path: '/formula/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Formula.findById(request.params.id, (err, formula) => {

        if (err) {
          return reply(err);
        }

        if (!formula) {
        return reply(Boom.notFound('Document not found.'));
      }

      reply(formula);
    });
    }
  });

  server.route({
    method: 'POST',
    path: '/formula',
    config: {
      auth: {
        strategy: 'simple'
      }
    },

    handler: function (request, reply) {

      Formula.create(
        (err, formula) => {

          if (err) {
            return reply(err);
          }
          return reply(formula);
        });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/formula/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Formula.findByIdAndDelete(request.params.id, (err, formula) => {

        if (err) {
          return reply(err);
        }

        if (!formula) {
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
  name: 'forumla'
};
