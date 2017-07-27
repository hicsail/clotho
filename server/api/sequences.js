'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Sequence = server.plugins['hapi-mongo-models'].Sequence;

  server.route({
    method: 'GET',
    path: '/sequence',
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

      Sequence.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/sequence/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Sequence.findById(request.params.id, (err, sequence) => {

        if (err) {
          return reply(err);
        }

        if (!sequence) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(sequence);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/sequence',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive(), // Case-insensitive.
          accession: Joi.string().optional(),
          isLinear: Joi.boolean().optional(),
          isSingleStranded: Joi.boolean().optional(),
          displayId: Joi.string().optional(),
          featureId: Joi.string().optional(),
          partId: Joi.string().optional()
        }
      }
    },

    handler: function (request, reply) {

      Sequence.create(
        request.payload.name,
        request.payload.description,
        request.auth.credentials.user._id.toString(),
        request.payload.displayId,
        request.payload.featureId, //feature id, should be parent if creating new one
        request.payload.partId,
        request.payload.sequence,
        request.payload.isLinear,
        request.payload.isSingleStranded,
        (err, sequence) => {

          if (err) {
            return reply(err);
          }
          return reply(sequence);
        });
    }
  });

  server.route({
    method: 'PUT',
    path: '/sequence/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().required(),
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive(), // Case-insensitive.
          accession: Joi.string().optional(),
          isLinear: Joi.boolean().optional(),
          isSingleStranded: Joi.boolean().optional(),
          displayId: Joi.string().optional(),
          featureId: Joi.string().optional(),
          partId: Joi.string().optional()
        }
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;

      const update = {
        $set: {
          name: request.payload.name,
          description: request.payload.description,
          sequence: request.payload.sequence,
          accession: request.payload.accession,
          isLinear: request.payload.isLinear,
          isSingleStranded: request.payload.isSingleStranded,
          displayId: request.payload.displayId,
          featureId: request.payload.featureId,
          partId: request.payload.partId
        }
      };

      // TODO: add findByIdAndUpdate() method in the sequence.js object file. Add here after.
      Sequence.findByIdAndUpdate(id, update, (err, sequence) => {

        if (err) {
          return reply(err);
        }

        if (!sequence) {
          return reply(Boom.notFound('Sequence not found.'));
        }

        reply(sequence);
      });
    }
  });

  server.route({
    method: 'DELETE',
    path: '/sequence/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Sequence.findByIdAndDelete(request.params.id, (err, sequence) => {

        if (err) {
          return reply(err);
        }

        if (!sequence) {
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
  name: 'sequence'
};
