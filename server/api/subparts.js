'use strict';

const Boom = require('boom');
const Joi = require('joi');


const internals = {};

internals.applyRoutes = function (server, next) {

  const Part = server.plugins['hapi-mongo-models'].Part;

  server.route({
    method: 'GET',
    path: '/subpart',
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
    path: '/subpart/{id}',
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
    path: '/subpart',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          displayId: Joi.string().optional(),
          bioDesignId: Joi.string().optional()
        }
      }
    },

    handler: function (request, reply) {

      Part.create(
        request.payload.name,
        request.payload.description,
        request.auth.credentials.user._id.toString(),
        request.payload.displayId,
        request.payload.bioDesignId,
        (err, part) => {

          if (err) {
            return reply(err);
          }
          return reply(part);
        });
    }
  });

  server.route({
    method: 'PUT',
    path: '/subpart/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          displayId: Joi.string().optional(),
          bioDesignId: Joi.string().optional(),
        }
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          name: request.payload.name,
          description: request.payload.description,
          displayId: request.payload.displayId,
          bioDesignId: request.payload.bioDesignId
        }
      };

      Part.findOneAndUpdate({_id: id, $isolated: 1}, update, (err, part) => {

        if (err) {
          return reply(err);
        }

        if (!part) {
          return reply(Boom.notFound('Sub-part not found.'));
        }

        reply(part);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/subpart/{id}',
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
  name: 'subpart'
};
