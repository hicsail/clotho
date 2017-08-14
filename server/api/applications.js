'use strict';
const AuthPlugin = require('../auth');
const Boom = require('boom');
const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {

  const Application = server.plugins['hapi-mongo-models'].Application;


  server.route({
    method: 'GET',
    path: '/application',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        query: {
          fields: Joi.string(),
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1)
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      const query = {};
      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;

      Application.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/application/{id}',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      Application.findById(request.params.id, (err, application) => {

        if (err) {
          return reply(err);
        }

        if (!application) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(application);
      });
    }
  });


  server.route({
    method: 'POST',
    path: '/application',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().required(),
          imageURL: Joi.string().required(),
          website: Joi.string().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      Application.create(
        request.payload.name,
        request.payload.description,
        request.auth.credentials.user._id.toString(),
        request.payload.imageURL,
        request.payload.website,
        (err, application) => {

          if (err) {
            return reply(err);
          }

          reply(application);
        });
    }
  });


  server.route({
    method: 'PUT',
    path: '/application/{id}',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        params: {
          id: Joi.string().invalid('root')
        },
        payload: {
          name: Joi.string().required(),
          description: Joi.string().required(),
          imageURL: Joi.string().required(),
          website: Joi.string().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          name: request.payload.name,
          description: request.payload.description,
          imageURL: request.payload.imageURL,
          website: request.payload.website
        }
      };

      Application.findByIdAndUpdate(id, update, (err, application) => {

        if (err) {
          return reply(err);
        }

        if (!application) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(application);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/application/{id}',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        params: {
          id: Joi.string().invalid('root')
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      Application.findByIdAndDelete(request.params.id, (err, application) => {

        if (err) {
          return reply(err);
        }

        if (!application) {
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
  name: 'applications'
};
