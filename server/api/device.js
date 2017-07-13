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
          name: Joi.string().optional(),
          displayId: Joi.string().optional(),
          role: Joi.string().valid('BARCODE', 'CDS', 'DEGRADATION_TAG', 'GENE', 'LOCALIZATION_TAG', 'OPERATOR', 'PROMOTER', 'SCAR', 'SPACER', 'RBS', 'RIBOZYME', 'TERMINATOR').optional(),
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive().optional(),
          parts: Joi.array().items(Joi.object().keys({
            name: Joi.string(),
            description: Joi.string(),
            displayId: Joi.string(),
            _id: Joi.string()
          })).optional(), // List of Part objects. (not subparts)
          parameters: Joi.array().items(Joi.object().keys({
            name: Joi.string().optional(),
            units: Joi.string(), // These should be updated.
            value: Joi.number(),
            variable: Joi.string()
          })).optional(),
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

      Async.auto({
        findSequences: function (done) {

          if (request.payload.sequence !== undefined && request.payload.sequence !== null) {
            Sequence.getSequenceBySequenceString(request.payload.sequence, done);
          } else {
            return done(null, []);
          }
        },
        findSubParts: ['findSequences', function (results, done) {

          // get Sequence ids from array
          var seqArr = results.findSequences;
          var partIds = [];
          for (var i = 0; i < seqArr.length; ++i) {
            if (seqArr[i]['partId'] !== undefined && seqArr[i]['partId'] !== null) {
              partIds.push((seqArr[i]['partId']).toString());
            }
          }

          if (request.payload.sequence !== undefined && request.payload.sequence !== null && partIds.length > 0) {
            // then query all sequences' part ids
            Part.getParts(partIds, done);

          } else {
            return done(null, []);
          }

        }],
        findParameters: ['findSubParts', function (results, done) {

          // using part documents from last step, get biodesigns
          var resultsArray = results.findSubParts;
          var bioDesignIds = [];


          if (resultsArray !== null) {
            for (var i = 0; i < resultsArray.length; ++i) {
              if (resultsArray[i]['bioDesignId'] !== undefined && resultsArray[i]['bioDesignId'] !== null) {
                bioDesignIds.push(resultsArray[i]['bioDesignId'].toString());
              } else if (typeof resultsArray[i] == 'string') {
                // Prior steps found multiple bd ids, but sequence/part was undefined.
                bioDesignIds.push(resultsArray[i]);
              }
            }
          }

          // only zero/one result, no need to search further
          if (request.payload.sequence !== undefined && request.payload.sequence !== null) {
            if (bioDesignIds.length === 0) {
              return done(null, []);
              //return reply({'debug': results});
            }

          }


          // otherwise keep going with parameters search
          if (request.payload.parameters !== null && request.payload.parameters !== undefined) {
            Parameter.getParameterByBioDesignId(bioDesignIds, request.payload.parameters, done);
          } else {
            done(null, bioDesignIds);
          }

        }],
        findModules: ['findParameters', function (results, done) {

          // collect bioDesign Ids
          var resultsArray = results.findParameters;
          var bioDesignIds = [];
          if (resultsArray != null) {
            for (var i = 0; i < resultsArray.length; ++i) {
              if (resultsArray[i]['bioDesignId'] !== undefined && resultsArray[i]['bioDesignId'] !== null) {
                bioDesignIds.push(resultsArray[i]['bioDesignId'].toString());
              } else if (typeof resultsArray[i] == 'string') {
                // Prior steps found multiple bd ids, but parameter was undefined.
                bioDesignIds.push(resultsArray[i]);
              }
            }
          }

          // only zero/one result, no need to search further
          if ((request.payload.sequence !== undefined && request.payload.sequence !== null) || (request.payload.parameters != undefined && request.payload.parameters !== null)) {
            if (bioDesignIds.length === 0) {
              return done(null, []);
              //return reply({'debug': results});
            }

          }


          // otherwise perform module search
          if (request.payload.role !== undefined && request.payload.role !== null) {
            Module.getModuleByBioDesignId(bioDesignIds, {role: request.payload.role}, done);
          } else {
            done(null, bioDesignIds);
          }

        }],
        findParts: ['findModules', function (results, done) {

          var resultsArray = results.findModules;
          var bioDesignIds = [];


          if (resultsArray !== null) {
            for (var i = 0; i < resultsArray.length; ++i) {
              if (resultsArray[i]['bioDesignId'] !== undefined && resultsArray[i]['bioDesignId'] !== null) {
                bioDesignIds.push(resultsArray[i]['bioDesignId'].toString());
              } else if (typeof resultsArray[i] == 'string') {
              // Prior steps found multiple bd ids, but sequence/part was undefined.
                bioDesignIds.push(resultsArray[i]);
              }
            }
          }

        // Equivalent of finding subdesigns
        // Match by subdesigns id, name, displayId, etc.
        // Return list of parent biodesigns.
        // To do - add parts !== undefined to other sections of async call.
          if (request.payload.parts !== undefined && request.payload.parts !== null) {
          //BioDesign.getSubDesignByBioDesignId(bioDesignIds, request.payload.parts, done);
            done(null, bioDesignIds);
          } else {
            done(null, bioDesignIds);
          }

        }],
        findBioDesigns: ['findParts', function (results, done) {

          // collect biodesign Ids
          var resultsArray = results.findModules;
          var bioDesignIds = [];
          if (resultsArray != null && resultsArray.length > 0) {
            for (let module of resultsArray) {
              if (module['bioDesignId'] !== undefined && module['bioDesignId'] !== null) {
                bioDesignIds.push(module['bioDesignId'].toString());
              } else if (typeof module == 'string') {
                // Prior steps found multiple bd ids, but parameter was undefined.
                bioDesignIds.push(module);
              }
            }
          }


          // No result, no need to search further
          if ((request.payload.sequence !== undefined || request.payload.parameters != undefined) || (request.payload.role !== undefined && request.payload.role !== null)) {
            if (bioDesignIds.length === 0) {
              return done(null, []);
              //return reply({'debug': results});
            }
          }

          var query = {};
          if (request.payload.name !== undefined) {
            query['name'] = request.payload.name;
          }

          if (request.payload.displayId !== undefined) {
            query['displayId'] = request.payload.displayId;
          }


          // Should not return anything if all arguments are empty.
          if (request.payload.name === undefined && request.payload.displayId === undefined
            && request.payload.sequence === undefined && request.payload.parameters === undefined
            && request.payload.role === undefined && request.payload.parts) {
            return done(null, []);
          } else {
            // Get full biodesigns.
            return BioDesign.getBioDesignIds(bioDesignIds, query, true, done);
          }


        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        if (results.findBioDesigns.length === 0) {
          return reply(Boom.notFound('Document not found.'));
        }

        return reply(results.findBioDesigns);
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

      BioDesign.getBioDesignIds(request.params.id, null, (err, bioDesign) => {

        if (err) {
          return reply(err);
        }

        if (!bioDesign || bioDesign.length === 0) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(bioDesign);

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
          role: Joi.string().valid('BARCODE', 'CDS', 'DEGRADATION_TAG', 'GENE', 'LOCALIZATION_TAG', 'OPERATOR', 'PROMOTER', 'SCAR', 'SPACER', 'RBS', 'RIBOZYME', 'TERMINATOR').optional(),
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

          var subBioDesignIds = request.payload.partIds;

          BioDesign.create(
            request.payload.name,
            null, // description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            null, //imageUrl
            subBioDesignIds,
            null, //superBioDesignIds
            'DEVICE',
            done);
        },
        updateSubBioDesignSuperDesign: ['createBioDesign', function (results, done) {

          // Need to update superDesign that belong to subdesigns
          // so that they have new bioDesginId associated
          var superBioDesignId = results.createBioDesign._id.toString();
          var subBioDesignIds = request.payload.partIds;

          if (subBioDesignIds !== undefined && subBioDesignIds !== null) {
            var allPromises = [];

            for (var i = 0; i < subBioDesignIds.length; ++i) {
              var promise = new Promise((resolve, reject) => {
                BioDesign.findByIdAndUpdate(subBioDesignIds[i], {$set: {superBioDesignId: superBioDesignId}}, (err, results) => {
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
              if (reject) {
                reply(reject);
              }
              done(null, resolve);
            });
          } else {
            done(null, []);
          }

        }],
        createParameters: ['createBioDesign', function (results, done) {
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

              done(null, resolve);
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

          // Links assembly to subpart of current Device.

          var superSubPartId = results.createSubpart._id.toString();
          var subBioDesignIds = request.payload.partIds;

          if (subBioDesignIds !== undefined && subBioDesignIds !== null) {
            Assembly.create(
              subBioDesignIds,
              request.auth.credentials.user._id.toString(),
              superSubPartId,
              done);
          } else {
            done(null, []);
          }
        }],
        updateSubDesignSubParts: ['createAssembly', function (results, done) {

          // Need to update subparts that belong to subdesigns
          // so that they have new assemblyId associated
          var assemblyId = results.createAssembly._id.toString();
          var subBioDesignIds = request.payload.partIds;

          if (subBioDesignIds !== undefined && subBioDesignIds !== null) {
            var allPromises = [];


            for (var i = 0; i < subBioDesignIds.length; ++i) {
              var promise = new Promise((resolve, reject) => {
                Part.updateMany({bioDesignId: subBioDesignIds[i]}, {$set: {assemblyId: assemblyId}}, (err, results) => {
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
              if (reject) {
                reply(reject);
              }

              done(null, resolve);
            });
          } else {
            done(null, []);
          }

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
