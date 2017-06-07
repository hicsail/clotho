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
  // const Parameter = server.plugins['hapi-mongo-models'].Parameter;

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
          userId: Joi.string().required(), // in the convenience methods is the author's name
          parameters: Joi.array().items(Joi.string()).optional(),
          sequence: Joi.string().optional(),
          role: Joi.string().optional(),
          displayId: Joi.string().optional()
        }
      }
    },

    handler: function (request, reply) {

      Async.auto({

        createSequence: function (done) {

          Sequence.create(
            request.payload.name,
            null, // no description
            request.payload.sequence,
            null,
            null,
            request.auth.credentials.user._id.toString(),
            null, // featureId null
            done);
        },
        createSubpart: ['createSequence', function (results, done) {

          var seq = results.createSequence._id.toString();
          Part.create(
            request.payload.name,
            null, // no description
            seq,
            request.auth.credentials.user._id.toString(),
            done);
        }],
        createAnnotation: ['createSequence', function (results, done) {

          var seq = results.createSequence._id.toString();
          Annotation.create(
            request.payload.name,
            null, // description,
            1, // start
            request.payload.sequence.length, // end
            seq, // sequenceId
            request.auth.credentials.user._id.toString(),
            true, // isForwardString
            done);
        }],
        createFeature: ['createSequence', 'createAnnotation', function (results, done) {

          var annot = results.createAnnotation._id.toString();
          Feature.create(
            annot,
            request.payload.name,
            null, // description
            request.payload.role,
            request.auth.credentials.user._id.toString(),
            done);
        }],
        createModule: ['createFeature', function (results, done) {

          var feat = [results.createFeature._id.toString()]; // not sure how to get feature schema?
          Module.create(
            request.payload.name,
            null, // description
            request.payload.role,
            feat,
            null, // no submoduleIds
            request.auth.credentials.user._id.toString(),
            done);
        }],
        createBioDesign: ['createModule', function (results, done) {

          BioDesign.create(
            request.payload.name,
            null,
            request.auth.credentials.user._id.toString(),
            done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        return reply(results);
      });


      // function calls to implement
      // setDisplayID for sequence
      // setDisplayID for Part

      // setSequence for feature
      // setDisplayID for feature

      // setFeature for Annotation
      // setDisplayID for Module
      // addPart for BioDesign
      // setModule for BioDesign
      // setDisplayID for BioDesign
      // addParamaters for BioDesign

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
