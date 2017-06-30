'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Device = server.plugins['hapi-mongo-models'].Device;
  const BioDesign = server.plugins['hapi-mongo-models'].BioDesign;
  const Part = server.plugins['hapi-mongo-models'].Part;
  const Assembly = server.plugins['hapi-mongo-models'].Assembly;
  const Sequence = server.plugins['hapi-mongo-models'].Sequence;
  const Feature = server.plugins['hapi-mongo-models'].Feature;
  const Module = server.plugins['hapi-mongo-models'].Module;
  const Parameter = server.plugins['hapi-mongo-models'].Parameter;
  const Annotation = server.plugins['hapi-mongo-models'].Annotation;

  server.route({
    method: 'PUT',
    path: '/device',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1),
          name: Joi.string(),
          displayId: Joi.string(),
          role: Joi.string().valid('BARCODE', 'CDS', 'DEGRADATION_TAG', 'GENE', 'LOCALIZATION_TAG', 'OPERATOR', 'PROMOTER', 'SCAR', 'SPACER', 'RBS', 'RIBOZYME', 'TERMINATOR'),
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive(),
          parts: Joi.array().items(Joi.object()), // List of part objects.
          parameters: Joi.array().items(
            Joi.object().keys({
              name: Joi.string().optional(),
              units: Joi.string(), // These should be updated.
              value: Joi.number(),
              variable: Joi.string()
            })
          ).optional(),
          userSpace: Joi.boolean().default(false)
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
          role: Joi.string().valid('BARCODE', 'CDS', 'DEGRADATION_TAG', 'GENE', 'LOCALIZATION_TAG', 'OPERATOR', 'PROMOTER', 'SCAR', 'SPACER', 'RBS', 'RIBOZYME', 'TERMINATOR'),
          partIds: Joi.array().items(Joi.string().required()),
          createSeqFromParts: Joi.boolean().required(),
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive().optional(),
          parameters: Joi.array().items(
            Joi.object().keys({
              name: Joi.string().optional(),
              units: Joi.string(), // These should be updated.
              value: Joi.number(),
              variable: Joi.string()
            })
          ).optional()
        }
      }
    },

    handler: function (request, reply) {
      //Used to create a Device consisting of a BioDesign, Part, and Assembly.
      // Optionally, may also create a Sequence, Feature, BasicModule, Parameters, and Annotations.
      //async.auto task `createAssembly` has a non-existent dependency `createSubAssemblyIds`
      // in createSubpart, createSubAssemblyIds
      //noinspection JSDuplicatedDeclaration
      Async.auto({
        createBioDesign: function (done) {

          BioDesign.create(
            request.payload.name,
            null, // description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            null,
            done);
        },
        createParameters: ['createBioDesign', function (results, done) {
          console.log("parameters");
          if (request.payload.parameters !== undefined && request.payload.parameters !== null) {

            var bioDesignId = results.createBioDesign._id.toString();
            var param = request.payload.parameters;
            var parameterLabels = ['name', 'value', 'variable', 'units'];

            for (let p of param) {
              for (let label of parameterLabels) {
                if (p[label] === undefined) {
                  p[label] = null;
                }
              }
            }

            var allPromises = [];
            for (var i = 0; i < param.length; ++i) {
              var promise = new Promise((resolve, reject) => {

                Parameter.create(
                  param[i]['name'],
                  request.auth.credentials.user._id.toString(),
                  bioDesignId,
                  param[i]['value'],
                  param[i]['variable'],
                  param[i]['units'],
                  (err, results) => {

                    if (err) {
                      reject(err);
                    } else {
                      resolve(results);
                    }
                  });
              });
              allPromises.push(promise);
            }

            Promise.all(allPromises).then((resolve, reject) => {

              done(null, allPromises);
            });
          }
          else {
            done(null, []);
          }
        }],
        createModule: ['createBioDesign', function (results, done) {

          if (request.payload.role !== undefined && request.payload.role !== null) {
            var bioDesignId = results.createBioDesign._id.toString();

            Module.create(
              request.payload.name,
              null, // description
              request.auth.credentials.user._id.toString(),
              request.payload.displayId,
              bioDesignId,
              request.payload.role,
              null, // no submoduleIds
              done);
          }
          else {
            done(null, []);
          }
        }],
        createSubpart: ['createBioDesign', function (results, done) {
          console.log("subparts");
          var bioDesignId = results.createBioDesign._id.toString();

          Part.create(
            request.payload.name,
            null, // no description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            bioDesignId,
            done);
        }],
        createAssembly: ['createSubpart', function (results, done) {

          var subBioDesignIds = request.payload.partIds;

          Part.findByBioDesignId('595409572a170f7522dc328c', (err, results) => {
            console.log(results);
            if (err) {
              return done(err);

            }
            else {
              Assembly.create(
                results,
                subBioDesignIds,
                request.auth.credentials.user._id.toString(),
                done);
            }
          }
          );

          // if (subPartIds == undefined) {
          //   subPartIds = null;
          // }
          // Assembly.create(
          //   subPartIds,
          //   subBioDesignIds,
          //   request.auth.credentials.user._id.toString(),
          //   done);
        }],
        createSequence: ['createSubpart', function (results, done) {

          if (request.payload.sequence !== undefined) {

            var partId = results.createSubpart._id.toString();

            Sequence.create(
              request.payload.name,
              null, // no description
              request.auth.credentials.user._id.toString(),
              request.payload.displayId,
              null, // featureId null
              partId,
              request.payload.sequence,
              null,
              null,
              done);
          }
          else {
            done(null, []);
          }
        }],
        createAnnotation: ['createSequence', function (results, done) {

          if (request.payload.sequence !== undefined) {

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
          }
          else {
            done(null, []);
          }
        }],
        createFeature: ['createModule', 'createAnnotation', function (results, done) {
          console.log("feature");
          var annotationId = null, moduleId = null;
          if (results.createAnnotation._id !== undefined) {
            annotationId = results.createAnnotation._id.toString();
          }

          if (results.createModule._id !== undefined) {
            moduleId = results.createModule._id.toString();
          }

          if (annotationId !== null && moduleId !== null) {
            Feature.create(
              request.payload.name,
              null, // description
              request.auth.credentials.user._id.toString(),
              request.payload.displayId,
              request.payload.role,
              annotationId,
              moduleId,
              done);
          } else {
            done(null, []);
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
