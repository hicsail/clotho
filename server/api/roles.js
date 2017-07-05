'use strict';
const AuthPlugin = require('../auth');
const Boom = require('boom');
const Joi = require('joi');
const ObjectID = require('mongo-models').ObjectID;


const internals = {};


internals.applyRoutes = function (server, next) {

  const Role = server.plugins['hapi-mongo-models'].Role;


  server.route({
    method: 'GET',
    path: '/roles',
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
          page: Joi.number().default(1),
          name: Joi.string().required()
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

      Role.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/roles/{id}',
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

      Role.findById(request.params.id, (err, role) => {

        if (err) {
          return reply(err);
        }

        if (!role) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(role);
      });
    }
  });


  server.route({
    method: 'POST',
    path: '/roles',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        payload: {
          name: Joi.string().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      const name = request.payload.name;
      const userId = request.auth.credentials.user._id.toString();

      Role.create(name, userId, (err, roles) => {

        if (err) {
          return reply(err);
        }

        reply(roles);
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/roles/{id}',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        payload: {
          name: Joi.string().required()
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
          name: request.payload.name
        }
      };

      Role.findOneAndUpdate({_id: ObjectID(id), $isolated: 1}, update, (err, roles) => {

        if (err) {
          return reply(err);
        }

        if (!roles) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(roles);
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/roles/{id}',
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

      Role.findByIdAndDelete(request.params.id, (err, roles) => {

        if (err) {
          return reply(err);
        }

        if (!roles) {
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
  name: 'roles'
};
