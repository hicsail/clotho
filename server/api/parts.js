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
    method: 'PUT',
    path: '/part',
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
          role: Joi.string(),
          sequence: Joi.string(),
          parameters: Joi.array().items(
            Joi.object().keys({
              name: Joi.string(),
              unit: Joi.string().allow(['m', 'cm', 'inches', 'in', 'nm']), // These should be updated.
              value: Joi.number(),
              variable: Joi.object()
            })
          ).optional()
        }
      }
    },
    handler: function (request, reply) {

      /* const fields = request.payload.fields;
       const sort = request.payload.sort;
       const limit = request.payload.limit;
       const page = request.payload.page;
       */

      Async.auto({
        findSequences: function (done) {

          if (request.payload.sequence !== null) {
            Sequence.getSequenceBySequenceString(request.payload.sequence, done);
          } else {
            done(null, []);
          }
        },
        findParts: ['findSequences', function (results, done) {
          // get Sequence ids from array
          var seqArr = results.findSequences;
          var partIds = [];
          for (var i = 0; i < seqArr.length; ++i) {
            if (seqArr[i]['partId'] !== null) {
              partIds.push((seqArr[i]['partId']).toString());
            }
          }

          if (request.payload.sequence !== null && partIds.length > 0) {
            // then query all sequences' part ids
            Part.getParts(partIds, done);

          } else {
            done(null, []);
          }

        }],
        findParameters: ['findParts', function (results, done) {
          // using part documents from last step, get biodesigns
          var partArray = results.findParts;
          var bioDesignIds = [];


          if (partArray !== null) {
            for (var i = 0; i < partArray.length; ++i) {
              if (partArray[i]['bioDesignId'] !== null) {
                bioDesignIds.push(partArray[i]['bioDesignId'].toString());
              } else if (typeof partArray[i] == 'string') {
                // Prior steps found multiple bd ids, but sequence/part was undefined.
                bioDesignIds.push(partArray[i]);
              }
            }
          }


          // only zero/one result, no need to search further
          if (request.payload.sequence !== null) {
            if (bioDesignIds.length === 0) {
              return reply({'debug': results});
            }

            if (bioDesignIds.length === 1) {
              // should get full BioDesign
              return BioDesign.getBioDesignIds(bioDesignIds, null, done);
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
          var parameterArray = results.findParameters;
          var bioDesignIds = [];
          if (parameterArray != null) {
            for (var i = 0; i < parameterArray.length; ++i) {
              if (parameterArray[i]['bioDesignId'] !== null && parameterArray[i]['bioDesignId'] !== undefined) {
                bioDesignIds.push(parameterArray[i]['bioDesignId'].toString());
              } else if (typeof parameterArray[i] == 'string') {
                // Prior steps found multiple bd ids, but parameter was undefined.
                bioDesignIds.push(parameterArray[i]);
              }
            }
          }


          // only zero/one result, no need to search further
          if (request.payload.parameters !== null && request.payload.parameters != undefined) {
            if (bioDesignIds.length === 0) {
              return reply({'debug': results});
            }

            if (bioDesignIds.length === 1) {
              // should get full BioDesign
              return BioDesign.getBioDesignIds(bioDesignIds, null, done);
            }
          }


          // otherwise perform module search
          if (request.payload.role !== null && request.payload.role !== undefined) {
            Module.getModuleByBioDesignId(bioDesignIds, {role: request.payload.role}, done);
          } else {
            done(null, bioDesignIds);
          }

        }],
        findBioDesigns: ['findModules', function (results, done) {

          // collect biodesign Ids
          var moduleArray = results.findModules;
          var bioDesignIds = [];
          if (moduleArray != null) {
            for (let module of moduleArray) {
              if (module['bioDesignId'] !== null) {
                bioDesignIds.push(module['bioDesignId'].toString());
              } else if (typeof module == 'string') {
                // Prior steps found multiple bd ids, but parameter was undefined.
                bioDesignIds.push(module);
              }
            }
          }

          // only zero/one result, no need to search further
          if (request.payload.role !== null && request.payload.role !== undefined) {
            if (bioDesignIds.length === 0) {
              return reply({'debug': results});
            }

            if (bioDesignIds.length === 1) {
              // should get full BioDesign
              return BioDesign.getBioDesignIds(bioDesignIds, null, done);
            }
          }

          var query = {name: request.payload.name, displayId: request.payload.displayId};

          // Get full biodesigns.
          return BioDesign.getBioDesignIds(bioDesignIds, query, done);

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
          displayId: Joi.string().optional(),
          role: Joi.string().optional(),
          parameters: Joi.array().items(Joi.object()).optional(), // assumed to be of the format (value, variable)
          sequence: Joi.string().optional()
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
            null,
            done);
        },
        createParameters: ['createBioDesign', function (results, done) {

          if (request.payload.parameters !== undefined && request.payload.parameters !== null) {

            var bioDesignId = results.createBioDesign._id.toString();
            var param = request.payload.parameters;

            for (var i = 0; i < param.length; ++i) {
              Parameter.create(
                request.payload.name,
                request.auth.credentials.user._id.toString(),
                bioDesignId,
                param[i]['value'],
                param[i]['variable'],
                param[i]['units'],
                done);
            }
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
        createSequence: ['createSubpart', function (results, done) {

          if (request.payload.sequence !== undefined && request.payload.sequence !== null) {

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
          }
          else {
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
