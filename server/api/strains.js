'use strict';
const AuthPlugin = require('../auth');
const Boom = require('boom');
const Joi = require('joi');



const internals = {};


internals.applyRoutes = function (server, next) {

  const Strain = server.plugins['hapi-mongo-models'].Strain;


  server.route({
    method: 'GET',
    path: '/strains',
    config: {
      auth: {
        strategies: ['simple','session'],
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

      Strain.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/strains/{id}',
    config: {
      auth: {
        strategies: ['simple','session'],
        scope: 'admin'
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      Strain.findById(request.params.id, (err, strain) => {

        if (err) {
          return reply(err);
        }

        if (!strain) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(strain);
      });
    }
  });


  server.route({
    method: 'POST',
    path: '/strains',
    config: {
      auth: {
        strategies: ['simple','session'],
        scope: 'admin'
      },
      validate: {
        payload: {
          pivot: Joi.string().required(),
          name: Joi.string().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      const pivot = request.payload.pivot;
      const name = request.payload.name;

      Strain.create(pivot, name, (err, strains) => {

        if (err) {
          return reply(err);
        }

        reply(strains);
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/strains/{id}',
    config: {
      auth: {
        strategies: ['simple','session'],
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

      Strain.findOneAndUpdate({_id: id, $isolated: 1}, update, (err, strains) => {

        if (err) {
          return reply(err);
        }

        if (!strains) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(strains);
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/strains/{id}',
    config: {
      auth: {
        strategies: ['simple','session'],
        scope: 'admin'
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      Strain.findByIdAndDelete(request.params.id, (err, strains) => {

        if (err) {
          return reply(err);
        }

        if (!strains) {
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
  name: 'strains'
};
