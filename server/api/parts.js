'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Sequence = server.plugins['hapi-mongo-models'].Sequence;
  const Part = server.plugins['hapi-mongo-models'].Part;
  const Feature = server.plugins['hapi-mongo-models'].Feature;
  const Annotation = server.plugins['hapi-mongo-models'].Annotation;
  const Module = server.plugins['hapi-mongo-models'].Module;
  const BioDesign = server.plugins['hapi-mongo-models'].BioDesign;
  const Parameter = server.plugins['hapi-mongo-models'].Parameter;

  server.route({
    method: 'GET',
    path: '/part',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        query: {
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1),
          name: Joi.string(),
          displayId: Joi.string(),
          role: Joi.string(),
          sequence: Joi.string(),
          parameters: Joi.array().items(Joi.object())
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
    path: '/part/{id}',
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
    path: '/part',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          parameters: Joi.array().items(Joi.object()).optional(), // assumed to be of the format (value, variable)
          sequence: Joi.string().optional(),
          role: Joi.string().optional(),
          displayId: Joi.string().optional()
        }
      }
    },

    handler: function (request, reply) {

      Async.auto({
        createBioDesign: function (done) {

          BioDesign.create(
            request.payload.name,
            null, // description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            done);
        },
        createSequence: function (done) {

          Sequence.create(
            request.payload.name,
            null, // no description
            request.payload.sequence,
            null,
            null,
            null, // featureId null
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            done);
        },
        createAnnotation: ['createSequence', function (results, done) {

          var seq = results.createSequence._id.toString();
          Annotation.create(
            request.payload.name,
            null, // description,
            request.auth.credentials.user._id.toString(),
            seq, // sequenceId
            1, // start
            request.payload.sequence.length, // end
            true, // isForwardString
            done);
        }],
        createFeature: ['createSequence', 'createAnnotation', function (results, done) {

          var annotationId = results.createAnnotation._id.toString();
          Feature.create(
            request.payload.name,
            null, // description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            request.payload.role,
            annotationId,
            done);
        }],
        createSubpart: ['createSequence', 'createBioDesign', function (results, done) {

          var sequenceId = results.createSequence._id.toString();
          var bioDesignId = results.createBioDesign._id.toString();
          Part.create(
            request.payload.name,
            null, // no description
            sequenceId,
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            bioDesignId,
            done);
        }],
        createModule: ['createFeature', function (results, done) {

          var featureIds = [results.createFeature._id.toString()]; // not sure how to get feature schema?
          var bioDesignId = results.createBioDesign._id.toString();

          Module.create(
            request.payload.name,
            null, // description
            request.payload.role,
            featureIds,
            null, // no submoduleIds
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            bioDesignId,
            done);
        }],
        createParameters: ['createBioDesign', function (results, done) {

          var bioDesignId = results.createBioDesign._id.toString();
          var param = request.payload.parameters;

          for (var i = 0; i < param.length; ++i) {

            Parameter.create(param[i]['value'], param[i]['variable'], bioDesignId, done);

          }

          done();
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        return reply(results);
      });


    }
  })
  ;

  server.route({
    method: 'DELETE',
    path: '/part/{id}',
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
}
;


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'part'
};
