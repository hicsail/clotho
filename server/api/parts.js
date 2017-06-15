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

      const fields = request.payload.fields;
      const sort = request.payload.sort;
      const limit = request.payload.limit;
      const page = request.payload.page;

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
          for (let seq of seqArr) {
            if (seq['partId'] !== null) {
              partIds.push(seq['partId'].toString());
            }
          }

          if (request.payload.sequence !== null && partIds.length > 0) {
            // then query all sequence's part ids
            Part.find({_id: {$in: partIds}}, done);
          } else {
            done(null, []);
          }

        }],
        findParameters: ['findParts', function (results, done) {
          // using part documents from last step, get biodesigns
          var partArr = results.findParts;
          var bioDesignIds = [];
          for (let part of partArr) {
            if (part['bioDesignId'] !== null) {
              bioDesignIds.push(part['bioDesignId'].toString());
            }
          }

          // only zero/one result, no need to search further
          if (request.payload.sequence !== null) {
            if (bioDesignIds.length === 0) {
              return reply({debug: results});
            }

            if (bioDesignIds.length === 1) {
              // should get full BioDesign
              return BioDesign.getBioDesignIds(bioDesignIds, null, done);
            }
          }

          // otherwise keep going with parameters search
          if (request.payload.parameters !== null) {
            Parameter.getParameterByBioDesignId(bioDesignIds, request.payload.parameters, done);
          } else {
            done(null, []);
          }

        }],
        findModules: ['findParameters', function (results, done) {
          // collect bioDesign Ids
          var parameterArray = results.findParameters;
          var bioDesignIds = [];
          for (let parameter of parameterArray) {
            if (parameter['bioDesignId'] !== null) {
              bioDesignIds.push(parameter['bioDesignId'].toString());
            }

          }

          // only zero/one result, no need to search further
          if (request.payload.parameters !== null) {
            if (bioDesignIds.length === 0) {
              return reply({debug: results});
            }

            if (bioDesignIds.length === 1) {
              // should get full BioDesign
              return BioDesign.getBioDesignIds(bioDesignIds, null, done);
            }
          }


          // otherwise perform module search
          if (request.payload.role !== null) {
            Module.getModuleByBioDesignId(bioDesignIds, {role: request.payload.role}, done);
          } else {
            done(null, []);
          }

        }],
        findBioDesigns: ['findModules', function (results, done) {

          // collect biodesign Ids
          var moduleArray = results.findModules;
          var bioDesignIds = [];
          for (let module of moduleArray) {
            if (module['bioDesignId'] !== null) {
              bioDesignIds.push(module['bioDesignId'].toString());
            }
          }

          // only zero/one result, no need to search further
          if (request.payload.role !== null) {
            if (bioDesignIds.length === 0) {
              return reply({debug: results});
            }

            if (bioDesignIds.length === 1) {
              // should get full BioDesign
              return BioDesign.getBioDesignIds(bioDesignIds, null, done);
            }
          }

          var query = {name: request.payload.name, displayId: request.payload.displayId};

          // get full biodesigns
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
        createSequence: ['createSubpart', function (results, done) {

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
        }],
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
        createFeature: ['createModule', 'createAnnotation', function (results, done) {

          var annotationId = results.createAnnotation._id.toString();
          var moduleId = results.createModule._id.toString();

          Feature.create(
            request.payload.name,
            null, // description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            request.payload.role,
            annotationId,
            moduleId,
            done);
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
        createModule: ['createBioDesign', function (results, done) {

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
        }],
        createParameters: ['createBioDesign', function (results, done) {

          var bioDesignId = results.createBioDesign._id.toString();
          var param = request.payload.parameters;

          for (var i = 0; i < param.length; ++i) {

            Parameter.create(
              request.auth.credentials.user._id.toString(),
              bioDesignId,
              param[i]['value'],
              param[i]['variable'],
              done);

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
