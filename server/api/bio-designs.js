'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const BioDesign = server.plugins['hapi-mongo-models'].BioDesign;

  server.route({
    method: 'GET',
    path: '/bio-design',
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

      BioDesign.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/bio-design/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      BioDesign.findById(request.params.id, (err, bioDesign) => {

        if (err) {
          return reply(err);
        }

        if (!bioDesign) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(bioDesign);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/bio-design',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          displayId: Joi.string().optional(),
          imageURL: Joi.string().optional()
        }
      }
    },

    handler: function (request, reply) {

      BioDesign.create(
        request.payload.name,
        request.payload.description,
        request.auth.credentials.user._id.toString(),
        request.payload.displayId,
        request.payload.imageURL,
        (err, bioDesign) => {

          if (err) {
            return reply(err);
          }
          return reply(bioDesign);
        });
    }
  });

  server.route({
    method: 'PUT',
    path: '/bio-design/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          displayId: Joi.string().optional(),
          imageURL: Joi.string().optional()
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
          imageURL: request.payload.imageURL
        }
      };

      BioDesign.findByIdAndUpdate(id, update, (err, bio_design) => {

        if (err) {
          return reply(err);
        }

        if (!bio_design) {
          return reply(Boom.notFound('Bio Design not found.'));
        }

        return reply(bio_design);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/bio-design/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      BioDesign.findByIdAndDelete(request.params.id, (err, bioDesign) => {

        if (err) {
          return reply(err);
        }

        if (!bioDesign) {
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
  name: 'bio-design'
};
