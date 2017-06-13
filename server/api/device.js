'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');

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

  //Original Java
  //public static ObjectId createDevice(Persistor persistor, String name,
  // List<String> partIDs, String author, boolean createSeqFromParts) {
// name, displayId, role, partIds, createSeqFromParts, sequence, parameters

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
          userId: Joi.string().optional(),
          displayId: Joi.string().optional(),
          role: Joi.string().optional(),
          partIds: Joi.array().items(Joi.string().required()),
          createSeqFromParts: Joi.boolean().required(),
          sequence: Joi.string().optional(),
          parameters: Joi.array().optional() //List<Parameters> parameters, insert parameter schema here
        }
      }
    },

    handler: function (request, reply) {
    //Used to create a Device consisting of a BioDesign, Part, and Assembly.
      // Optionally, may also create a Sequence, Feature, BasicModule, Parameters, and Annotations.
      Async.auto({
        createBioDesign: function (done) {

          BioDesign.create(
            request.payload.name,
            null, // description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            done);
        },
        createSubpart: ['createSequence', 'createBioDesign', function (results, done) {

          var sequenceId = results.createSequence._id.toString();
          var bioDesignId = results.createBioDesign._id.toString();
          Part.create(
            request.payload.name,
            null, // no description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            bioDesignId,
            sequenceId,
            done);
        }],
        createAssembly: function (results, done) {

          var part = results.createPart._id.toString();
          var subAssemblyIds = results.createSubAssembly._id.toString();
          Assembly.create(
            part,
            subAssemblyIds,
            done);
        },
        createSequence: function (done) {

          Sequence.create(
            request.payload.name,
            null, // no description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            null, // featureId null
            request.payload.sequence,
            null,
            null,
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
        createModule: ['createFeature', function (results, done) {

          var featureIds = [results.createFeature._id.toString()]; // not sure how to get feature schema?
          var bioDesignId = results.createBioDesign._id.toString();

          Module.create(
            request.payload.name,
            null, // description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            bioDesignId,
            request.payload.role,
            featureIds,
            null, // no submoduleIds
            done);
        }],
        createParameters: ['createBioDesign', function (results, done) {

          var bioDesignId = results.createBioDesign._id.toString();
          var param = request.payload.parameters;

          for (var i = 0; i < param.length; ++i) {

            Parameter.create(bioDesignId, param[i]['value'], param[i]['variable'], done);

          }

        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        return reply(results);
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
