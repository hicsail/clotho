'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
const ObjectID = require('mongo-models').ObjectID;


const internals = {};

internals.applyRoutes = function (server, next) {

  const Sequence = server.plugins['hapi-mongo-models'].Sequence;
  const Part = server.plugins['hapi-mongo-models'].Part;
  const Feature = server.plugins['hapi-mongo-models'].Feature;
  const Annotation = server.plugins['hapi-mongo-models'].Annotation;
  const Module = server.plugins['hapi-mongo-models'].Module;
  const BioDesign = server.plugins['hapi-mongo-models'].BioDesign;
  const Parameter = server.plugins['hapi-mongo-models'].Parameter;
  const Role = server.plugins['hapi-mongo-models'].Role;
  const Version = server.plugins['hapi-mongo-models'].Version;

  /**
   * @api {put} /api/put
   * @apiName Search for Part
   * @apiDescription Get BioDesignId of Part based on arguments.
   * @apiGroup Convenience Methods
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} [name]  name of part.
   * @apiParam {String} [displayId]  displayId of part.
   * @apiParam {String} [role]  role of the feature
   * @apiParam {String=ATUCGRYKMSWBDHVN} [sequence]  nucleotide sequence using nucleic acid abbreviation. Case-insensitive.
   * @apiParam (Object) [parameters] can include "name", "units", "value", "variable"
   * @apiParam {Boolean} [userSpace=false] If userspace is true, it will only filter by your bioDesigns
   * @apiParam {Boolean} [searchDeleted=false] whether to search for only deleted parts (true) or only non-deleted parts (false).
   *
   * @apiParamExample {json} Request-Example:
   *  {
   "name": "BBa_0123",
   "displayId": "TetR repressible enhancer",
   "role": "PROMOTER",
   "sequence": "tccctatcagtgatagagattgacatccctatcagtgc",
   "parameters": [
    {
    "name": "enhancer unbinding rate",
    "value": 0.03,
    "variable": "K7",
    "units": "min-1"
    },
    {
    "name": "mRNA degradation rate",
    "value": 0.02,
    "variable": "dmrna",
    "units": "min-1"
     }
   ]
  }
   *
   * @apiSuccessExample {json} Success-Response:
   *
   [
   "5989f9e0083e509dff943dde"
   ]
   *
   * @apiErrorExample {json} Error-Response 1:
   * {
   * "statusCode": 404,
    "error": "Not Found",
    "message": "Document not found."
   * }
   */


  server.route({
    method: 'PUT',
    path: '/part',
    config: {
      auth: {
        strategy: 'simple'
      },
      pre: [{
        assign: 'checkrole',
        method: function (request, reply) {

          var role = request.payload.role;
          if (role !== undefined && role !== null) {

            Role.checkValidRole(role, (err, results) => {

              if (err || !results) {
                return reply(Boom.badRequest('Role invalid.'));
              } else {
                reply(true);
              }
            });
          } else {
            reply(true);
          }
        }
      }],
      validate: {
        payload: {
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1),
          name: Joi.string().optional(),
          displayId: Joi.string().optional(),
          role: Joi.string().optional(),
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive().optional(),
          parameters: Joi.array().items(
            Joi.object().keys({
              name: Joi.string().optional(),
              units: Joi.string(),
              value: Joi.number(),
              variable: Joi.string()
            })
          ).optional(),
          userSpace: Joi.boolean().default(false),
          searchDeleted: Joi.boolean().default(false)
        }
      }
    },
    handler: function (request, reply) {

      const searchDeleted = request.payload.searchDeleted;

      Async.auto({
        findPartIdsBySequences: function (done) {

          if (request.payload.sequence !== undefined && request.payload.sequence !== null) {

            if (searchDeleted) {
              Sequence.getSequenceBySequenceString(request.payload.sequence, {toDelete: true}, done);
            } else {
              Sequence.getSequenceBySequenceString(request.payload.sequence, {toDelete: null}, done);
            }

          } else {
            return done(null, null);
          }
        },
        findParts: ['findPartIdsBySequences', function (results, done) {

          var partIdsFromSequence = []
          var partIds = []
          var partIdsTotal = []

          if (results.findPartIdsBySequences !== null && results.findPartIdsBySequences !== undefined) {
            partIdsFromSequence = results.findPartIdsBySequences;
          }

          if (request.payload.partIds !== undefined && request.payload.partIds !== null) {
            partIds = request.payload.partIds;
          }

          if (partIdsFromSequence.length !== 0 && partIds.length !== 0) {
              partIdsTotal = partIds.filter(function (item) {
              return partIdsFromSequence.indexOf(item) != -1;
            });
          } else {
              partIdsTotal = partIdsFromSequence.concat(partIds.filter(function (item) {
              return partIdsFromSequence.indexOf(item) < 0;
            }));
          }

          if (partIdsTotal.length > 0) {
            if (searchDeleted) {
              Part.getParts(partIdsTotal, {toDelete: true}, done);
            } else {
              Part.getParts(partIdsTotal, {toDelete: null}, done);
            }
          } else {
            return done(null, null);
          }

        }],
        findParameters: function (done) {

          // using part documents from last step, get biodesigns
          if (request.payload.parameters !== undefined && request.payload.parameters !== null) {
            if (searchDeleted) {
              Parameter.getByParameter(request.payload.parameters, {toDelete: true}, done);
            } else {
              Parameter.getByParameter(request.payload.parameters, {toDelete: null}, done);
            }

          }
          else {
            return done(null, null); //null array returned for unsuccesful search, return null if no parameter seached for
          }
        },
        findModules: function (done) {

          // using part documents from last step, get biodesigns
          if (request.payload.role !== undefined && request.payload.role !== null) {
            if (searchDeleted) {
              Module.getByModule(request.payload.role, {toDelete: true}, done);
            } else {
              Module.getByModule(request.payload.role, {toDelete: null}, done);
            }
          }
          else {
            return done(null, null);
          }
        },
        findBioDesigns: ['findParts', 'findParameters', 'findModules', function (results, done) {

          var intersectBDs = [];
          var setBDs = [];
          //set of duplicate bioDesigns found so far
          if (results.findParts !== null){
            setBDs.push(results.findParts);
          }
          if (results.findParameters !== null){
            setBDs.push(results.findParameters);
          }
          if (results.findModules !== null){
            setBDs.push(results.findModules);
          }

          for (var i = 0; i < setBDs.length; ++i) {
            if (i !== setBDs.length - 1) {                      //if there exists i+1,
              setBDs[i+1] = setBDs[i].filter(function (item) {  // i+1 equals to the intersect of i and i+1
                return setBDs[i+1].indexOf(item) != -1;;
              });
            } else {
              intersectBDs = setBDs[i]   //last in setBDs is the intersect of all inputs
            }
          }

          //query for all information found within bioDesignId Object, using above bioDesigns if availaible
          var query = {};
          if (request.payload.name !== undefined) {
            query['name'] = request.payload.name;
          }

          if (request.payload.displayId !== undefined) {
            query['displayId'] = request.payload.displayId;
          }

          if (request.payload.userSpace) {
            query['userId'] = request.auth.credentials.user._id.toString();
          }

          if (searchDeleted) {
            query['toDelete'] = true;
          } else {
            query['toDelete'] = null;
          }

          // Should return everything if all arguments are empty.
          if (request.payload.name === undefined && request.payload.displayId === undefined
            && request.payload.sequence === undefined && request.payload.parameters === undefined
            && request.payload.role === undefined) {
            return BioDesign.find(); //change this to a list of bioDesignIds
          }

          else if (Object.keys(query).length === 0) { //if there's no query for the bioDesign object
            done (null, intersectBDs)
          }
          else if (request.payload.sequence === undefined && request.payload.parameters === undefined
            && request.payload.role === undefined) {

            return BioDesign.getBioDesignIdsByQuery([], query, done);
          }

          else {
            // Get full biodesigns.
            return BioDesign.getBioDesignIdsByQuery(intersectBDs, query, done);
          }
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        if (results.findBioDesigns.length === 0) {
          return reply([]);
        }

        return reply(results.findBioDesigns);
      });

    }
  })
  ;

  /**
   * @api {put} /api/part/:filter Get Part With Filter
   * @apiName Get Part With Filter
   * @apiDescription Get attribute of a part based on arguments. Valid filters include parameters, modules, subparts, _id,
   * name, description, userId, displayId, and superBioDesignId. Note that using the filters for
   * parameters, modules, and subparts will return bioDesign-specific attributes as well.
   * @apiGroup Convenience Methods
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} filter parameters, modules, subparts, _id,
   * name, description, userId, displayId, and superBioDesignId
   * @apiParam {String} [name]  name of part.
   * @apiParam {String} [displayId]  displayId of part.
   * @apiParam {String} [role]  role of the feature
   * @apiParam {String=ATUCGRYKMSWBDHVN} [sequence]  nucleotide sequence using nucleic acid abbreviation. Case-insensitive.
   * @apiParam (Object) [parameters] can include "name", "units", "value", "variable"
   * @apiParam {Boolean} [userSpace=false] If userspace is true, it will only filter by your bioDesigns
   * @apiParam {Boolean} [searchDeleted=false] whether to search for only deleted parts (true) or only non-deleted parts (false).
   *
   * @apiParamExample {json} Request-Example:
   *  {
 "name": "BBa_R0040",
 "displayId": "TetR repressible promoter",
 "role": "PROMOTER",
 "sequence": "tccctatcagtgatagagattgacatccctatcagtgatagagatactgagcac",
 "userSpace": true,
 "parameters": [
  {
  "name": "promoter unbinding rate",
  "value": 0.03,
  "variable": "K7",
  "units": "min-1"
  },
  {
  "name": "mRNA degradation rate",
  "value": 0.02,
  "variable": "dmrna",
  "units": "min-1"
   }
 ]
}

   * @apiSuccessExample {json} Success-Response (for api/part/parameters):
   *
   * [
   [
   {
       "_id": "598b7d0e222537a996a9758d",
       "name": "BBa_R0040",
       "description": null,
       "userId": "593f0d81b59d9120de14d897",
       "displayId": "TetR repressible promoter",
       "imageURL": null,
       "subBioDesignIds": null,
       "superBioDesignId": null,
       "type": "PART"
   },
   {
       "_id": "598b7d0e222537a996a9758f",
       "name": "promoter unbinding rate",
       "userId": "593f0d81b59d9120de14d897",
       "bioDesignId": "598b7d0e222537a996a9758d",
       "value": 0.03,
       "variable": "K7",
       "units": "min-1"
   }
   ]
   ]
   *
   * @apiErrorExample {json} Error-Response 1 - no parts match:
   * {
   * "statusCode": 404,
    "error": "Not Found",
    "message": "Document not found."
   * }
   *
   * @apiErrorExample {json} Error-Response 2 - invalid role:
   * {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Role invalid."
}
   */


  server.route({
    method: 'PUT',
    path: '/part/{filter}',
    config: {
      auth: {
        strategy: 'simple'
      },
      pre: [{
        assign: 'checkfilter',
        method: function (request, reply) {

          // Check if filter is valid.
          // TODO - update with any new biodesign attributes
          var schema = {
            filter: Joi.string().valid('parameters', 'modules', 'subparts', 'sequences', 'annotations', 'features',
              '_id', 'name', 'description', 'userId', 'displayId', 'moduleId', 'superBioDesignId').required()
          };
          var filter = {filter: request.params.filter};

          Joi.validate(filter, schema, (err, result) => {

            if (err === null) {
              reply(true);
            } else {
              return reply(Boom.badRequest(err));
            }
          });

        }
      }],
      validate: {
        payload: {
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1),
          name: Joi.string().optional(),
          displayId: Joi.string().optional(),
          role: Joi.string().optional(),
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive().optional(),
          parameters: Joi.array().items(
            Joi.object().keys({
              name: Joi.string().optional(),
              units: Joi.string(), // These should be updated.
              value: Joi.number(),
              variable: Joi.string()
            })
          ).optional(),
          userSpace: Joi.boolean().default(false),
          searchDeleted: Joi.boolean().default(false)
        }
      }
    },
    handler: function (request, reply) {
      Async.auto({

        getPut: function (done) {
          var newRequest = {
            url: '/api/part',
            method: 'PUT',
            payload: request.payload,
            credentials: request.auth.credentials
          };

          server.inject(newRequest, (response) => {
            // Check for error. Includes no document found error.
            if (response.statusCode !== 200) {
              return reply(response.result);
            }
            done(null, response.result)
          });
        },
        getBioDesign : ['getPut', function (results, done) {

          var resultArr = results.getPut;
          BioDesign.getBioDesignIds(resultArr, null, false, (err, results) => {

            if (err) {
              return err;
            }
            done(null, results);
          });
        }],
        getResults: ['getBioDesign', function (results, done) {

          const filter =  request.params.filter
          var bioDesigns = results.getBioDesign;
          var filteredArr = []

          for (let bigPart in bioDesigns) {
            var filteredObj = [null, null];

            //get filter object
            if (filter === 'parameters') {
              filteredObj[1] = bioDesigns[bigPart]['parameters'][0]
            }
            else if (filter === 'modules') {
              filteredObj[1] = bioDesigns[bigPart]['modules'][0];
              delete filteredObj[1]['features']
            }
            else if (filter === 'subparts') {
              filteredObj[1] = bioDesigns[bigPart]['subparts'][0];
              delete filteredObj[1]['sequences']
            }
            else if (filter === 'sequences') {
              filteredObj[1] = bioDesigns[bigPart]['subparts'][0]['sequences'][0];
              delete filteredObj[1]['annotations']
            }
            else if (filter === 'annotations') {
              filteredObj[1] = bioDesigns[bigPart]['subparts'][0]['sequences'][0]['annotations'][0];
              delete filteredObj[1]['features']
            }
            else if (filter === 'features') {
              filteredObj[1] = bioDesigns[bigPart]['modules'][0]['features'][0]
            }

            //get bioDesign object
            filteredObj[0] = bioDesigns[bigPart];
            delete filteredObj[0]['parameters'];
            delete filteredObj[0]['modules'];
            delete filteredObj[0]['subparts'];

            filteredArr.push(filteredObj);
          }

          if (filteredArr.length > 0 && typeof filteredArr[0] === 'string') {
            return reply(filteredArr.join());
          } else {
            return reply(filteredArr);
          }
        }]
      })
      }
  });

  /**
   * @api {get} /api/part/:id Get Part By Id
   * @apiName Get Part By Id
   * @apiDescription Get complete Part by ID
   * @apiGroup Convenience Methods
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} id Part unique ID. (BioDesign ID)
   *
   * @apiSuccessExample {json} Success-Response:
   * [
   {
       "_id": "5967e04fc68f3c2e640cf9c6",
       "name": "B010",
       "description": null,
       "userId": "5939ba97b8e96112986d3be8",
       "displayId": "sample2",
       "imageURL": null,
       "subBioDesignIds": null,
       "superBioDesignId": "5967e0efc68f3c2e640cf9cd",
       "type": "PART",
       "subparts": [
           {
               "_id": "5967e04fc68f3c2e640cf9c9",
               "name": "B010",
               "description": null,
               "userId": "5939ba97b8e96112986d3be8",
               "displayId": "sample2",
               "bioDesignId": "5967e04fc68f3c2e640cf9c6",
               "assemblyId": "5967e0efc68f3c2e640cf9d1",
               "sequences": [
                   {
                       "_id": "5967e04fc68f3c2e640cf9ca",
                       "name": "B010",
                       "description": null,
                       "userId": "5939ba97b8e96112986d3be8",
                       "displayId": "sample2",
                       "featureId": "5967e04fc68f3c2e640cf9cc",
                       "partId": "5967e04fc68f3c2e640cf9c9",
                       "sequence": "CTTATT",
                       "isLinear": null,
                       "isSingleStranded": null,
                       "annotations": [
                           {
                               "_id": "5967e04fc68f3c2e640cf9cb",
                               "name": "B010",
                               "description": null,
                               "userId": "5939ba97b8e96112986d3be8",
                               "sequenceId": "5967e04fc68f3c2e640cf9ca",
                               "start": 1,
                               "end": 6,
                               "isForwardStrand": true,
                               "features": [
                                   {
                                       "_id": "5967e04fc68f3c2e640cf9cc",
                                       "name": "B010",
                                       "description": null,
                                       "userId": "5939ba97b8e96112986d3be8",
                                       "displayId": "sample2",
                                       "role": "GENE",
                                       "annotationId": "5967e04fc68f3c2e640cf9cb",
                                       "moduleId": "5967e04fc68f3c2e640cf9c8"
                                   }
                               ]
                           }
                       ]
                   }
               ]
           }
       ],
       "modules": [
           {
               "_id": "5967e04fc68f3c2e640cf9c8",
               "name": "B010",
               "description": null,
               "userId": "5939ba97b8e96112986d3be8",
               "displayId": "sample2",
               "bioDesignId": "5967e04fc68f3c2e640cf9c6",
               "role": "GENE",
               "submoduleIds": null,
               "features": [
                   {
                       "_id": "5967e04fc68f3c2e640cf9cc",
                       "name": "B010",
                       "description": null,
                       "userId": "5939ba97b8e96112986d3be8",
                       "displayId": "sample2",
                       "role": "GENE",
                       "annotationId": "5967e04fc68f3c2e640cf9cb",
                       "moduleId": "5967e04fc68f3c2e640cf9c8"
                   }
               ]
           }
       ],
       "parameters": [
           {
               "_id": "5967e04fc68f3c2e640cf9c7",
               "name": "sodium",
               "userId": "5939ba97b8e96112986d3be8",
               "bioDesignId": "5967e04fc68f3c2e640cf9c6",
               "value": 99,
               "variable": "Na",
               "units": "mM"
           }
       ]
   }
   ]
   *
   * @apiErrorExample {json} Error-Response 1:
   * {
    "statusCode": 404,
    "error": "Not Found",
    "message": "Document not found."
}
   */

  server.route({
    method: 'GET',
    path: '/part/{id}',
    config: {
      auth: {
        strategy: 'simple',
      },
      pre: [{
        assign: 'checkVersion',
        method: function (request, reply) {

          var bioDesignId = request.params.id;

          Version.findNewest(bioDesignId, 'bioDesign', (err, results) => {
            if (err) {
              return err;
            } else {
              // This automatically find newest version if it exists, if not returns original
              reply (results);
            }
          });
        }
      }]
    },
    handler: function (request, reply) {

      var versionResults = request.pre.checkVersion;
      var lastUpdatedId = versionResults[0]  //returns current id, if no newer version

      BioDesign.getBioDesignIds(lastUpdatedId, null, false, (err, bioDesign) => {

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

  /**
   * @api {post} /api/part Create Part
   * @apiName Create Part
   * @apiDescription Create part based on arguments
   * @apiGroup Convenience Methods
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} name  name of part.
   * @apiParam {String} [displayId]  displayId of part.
   * @apiParam {String} [role]  role of the feature
   * @apiParam (Object) [parameters] can include "name", "units", "value", "variable"
   * @apiParam {String=ATUCGRYKMSWBDHVN} [sequence]  nucleotide sequence using nucleic acid abbreviation. Case-insensitive.
   *
   * @apiParamExample {json} Request-Example:
   *
   *{
   * "name": "BBa_R0040",
   * "displayId": "TetR repressible promoter",
   * "role": "PROMOTER",
   * "sequence": "tccctatcagtgatagagattgacatccctatcagtgatagagatactgagcac",
   * "parameters": [
   *  {
   *  "name": "promoter unbinding rate",
   *  "value": 0.03,
   *  "variable": "K7",
   *    "units": "min-1"
   *  },
   *  {
   *    "name": "mRNA degradation rate",
   *    "value": 0.02,
   *    "variable": "dmrna",
   *    "units": "min-1"
   *   }
   * ]
   *}
   *
   * @apiSuccessExample {string} Success-Response:
   * 5952e539ed2e7c2df88b7f8a
   *
   * @apiErrorExample {json} Error-Response 1 - Invalid role:
   * {
   *  "statusCode": 400,
   *  "error": "Bad Request",
   *  "message": "Role invalid."
   *  }
   */

  server.route({
    method: 'POST',
    path: '/part',
    config: {
      auth: {
        strategy: 'simple'
      },
      pre: [{
        assign: 'checkrole',
        method: function (request, reply) {

          var role = request.payload.role;
          if (role !== undefined && role !== null) {

            Role.checkValidRole(role, (err, results) => {

              if (err || !results) {
                return reply(Boom.badRequest('Role invalid.'));
              } else {
                reply(true);
              }
            });
          } else {
            reply(true);
          }
        }
      }],
      validate: {
        payload: {
          name: Joi.string().required(),
          displayId: Joi.string().optional(),
          role: Joi.string().optional(),
          parameters: Joi.array().items(
            Joi.object().keys({
              name: Joi.string().optional(),
              units: Joi.string(), // These should be updated.
              value: Joi.number(),
              variable: Joi.string()
            })
          ).optional(),
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive().optional()
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
            null, //imageURL
            null, //subBioDesignIds
            null, //superBioDesignId
            'PART', //type
            request.auth.credentials.session.application.toString(), //application
            done);
        },
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
                  }
                );

              });

              allPromises.push(promise);
            }

            Promise.all(allPromises).then((resolve, reject) => {

              done(null, allPromises);
            });
          }
          else {
            return done(null, []);
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
            return done(null, []);
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
            return done(null, []);
          }
        }],
        createAnnotation: ['createSequence', function (results, done) {

          if (request.payload.sequence !== undefined && request.payload.sequence !== null) {

            var seq = results.createSequence._id.toString();
            Annotation.create(
              request.payload.name,
              null, // description,
              request.auth.credentials.user._id.toString(),
              seq, // sequenceId
              null, //superSequenceId - never updated, null indicates it is directly part of a part or device
              1, // start
              request.payload.sequence.length, // end
              true, // isForwardString
              done);
          }
          else {
            return done(null, []);
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
              null, //superAnnotationId
              moduleId,
              done);
          }
          else {
            return done(null);
          }
        }],
        updateSequenceFeatureId: ['createFeature', 'createSequence', function (results, done) {

          if (results.createFeature && request.payload.sequence !== undefined && request.payload.sequence !== null) {
            var featureId = results.createFeature._id.toString();
            var sequenceId = results.createSequence._id.toString();

            Sequence.findOneAndUpdate({
              _id: ObjectID(sequenceId),
              $isolated: 1
            }, {$set: {featureId: featureId}}, (err, results) => {

              if (err) {
                return reply(err);
              } else {
                done(null, results);
              }
            });
          } else {
            done(null, results);
          }

        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        return reply(results.createBioDesign._id.toString());
      });
    }
  })
  ;

  /**
   * @api {put} /api/part/update/:id Update Part by Id
   * @apiName  Update Part by Id
   * @apiDescription Include arguments in payload to update part.
   * @apiGroup Convenience Methods
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} name  name of part.
   * @apiParam {String} [displayId]  displayId of part.
   * @apiParam {String} [role]  role of the feature
   * @apiParam (Object) [parameters] can include "name", "units", "value", "variable"
   * @apiParam {String=ATUCGRYKMSWBDHVN} [sequence]  nucleotide sequence using nucleic acid abbreviation. Case-insensitive.
   * @apiParam {Boolean} [userSpace=false] If userspace is true, it will only filter by your bioDesigns
   *
   * @apiParamExample {json} Request-Example:
   *
   * {
	"name": "BBa_E0040",
	"displayId": "green fluorescent protein derived from jellyfish",
	"role": "PROMOTER",
	"parameters": [{
		"name": "color",
		"variable": "green",
		"value": 1,
		"units": "nM"
	}],
	"sequence": "ATGCGTAAA"

}
   *
   * @apiSuccessExample {json} Success-Response:
   * 5984d2fc75bee68ac054faa9
   *
   * @apiErrorExample {json} Error-Response 1 - Invalid part id:

   {
   * "statusCode": 404,
    "error": "Not Found",
    "message": "Document not found."
   * }
   *
   *@apiErrorExample {json} Error-Response 2 - Invalid role:
   * {
   *  "statusCode": 400,
   *  "error": "Bad Request",
   *  "message": "Role invalid."
   *  }
   *
   */

  server.route({
    method: 'PUT',
    path: '/part/update/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      pre: [{
        assign: 'checkrole',
        method: function (request, reply) {

          // Check role is valid before looking for request.

          var role = request.payload.role;
          if (role !== undefined && role !== null) {

            Role.checkValidRole(role, (err, results) => {

              if (err || !results) {
                return reply(Boom.badRequest('Role invalid.'));
              } else {
                reply(true);
              }
            });
          } else {
            reply(true);
          }
        }
      },
      {
        assign: 'checkBioDesign',
        method: function (request, reply) {

            // Check that biodesign exists - should not perform update if biodesign does not exist.
          var bioDesignId = request.params.id;

          BioDesign.find({_id: ObjectID(bioDesignId), type: 'PART'}, (err, results) => {

            if (err) {
              return reply(err);
            } else if (results === null || results.length === 0) {
              return reply(Boom.notFound('Part does not exist.'));
            } else {
              reply(true);
            }
          }
            );
        }
      },
      {
        assign: 'checkVersion',
        method: function (request, reply) {

          var bioDesignId = request.params.id;

          Version.findNewest(bioDesignId, 'bioDesign', (err, results) => {
            if (err) {
              return err;
            } else {
              // This automatically find newest version if it exists, if not returns original
              reply (results);
            }
          });
        }
      }],
      validate: {
        payload: {
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1),
          name: Joi.string().optional(),
          displayId: Joi.string().optional(),
          role: Joi.string().optional(),
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive().optional(),
          parameters: Joi.array().items(
            Joi.object().keys({
              name: Joi.string().optional(),
              units: Joi.string(),
              value: Joi.number(),
              variable: Joi.string()
            })
          ).optional(),
          userSpace: Joi.boolean().default(false)
        }
      }
    },
    handler: function (request, reply) {


      Async.auto({

        //get most updated ID
        getOldPart: function (done) {
          var versionResults = request.pre.checkVersion;
          var lastUpdatedId = versionResults[0]  //return current id, if no newer version

          BioDesign.getBioDesignIds(lastUpdatedId, null, 'PART', done);
        },
        createNewPart: ['getOldPart', function (results, done) {

          // Build up appropriate payload for part creation.
          const args = ['name', 'displayId', 'role', 'sequence', 'parameters'];
          var newPayload = {};
          var oldPart = results.getOldPart[0];

          for (var i = 0; i < args.length; ++i) {

            // If argument in payload was null, retrieve value from old Part.

            if (request.payload[args[i]] === undefined || request.payload[args[i]] === null) {

              if (args[i] === 'sequence') {
                if (oldPart['subparts'][0]['sequences'] !== undefined && oldPart['subparts'][0]['sequences'] !== null){
                  newPayload.sequence = oldPart['subparts'][0]['sequences'][0]['sequence'];
                }
              } else if (args[i] === 'role') {
                if (oldPart['modules'] !== undefined && oldPart['modules'] !== null && oldPart['modules'].length !== 0) {
                  newPayload.role = oldPart['modules'][0]['role'];
                }
              } else if (args[i] === 'parameters') {
                // Loop through old parameters value
                if (oldPart['parameters'].length !== 0 && oldPart['parameters'] !== null && oldPart['parameters'] !== undefined) {


                  var oldParameters = oldPart['parameters'];
                  var newParameters = null;
                  if (oldParameters != null && oldParameters.length !== 0) {
                    newParameters = [];
                  }
                  var parameterKeys = ['name', 'units', 'value', 'variable'];
                  for (var oldParameter of oldParameters) {
                    var p = {};

                    for (var paraKey of parameterKeys)
                    {
                      if (oldParameter[paraKey] !== undefined && oldParameter[paraKey] !== null) {
                        p[paraKey] = oldParameter[paraKey];
                      }
                    }
                    newParameters.push(p);
                  }
                  newPayload.parameters = newParameters;
                }
              } else if (args[i] === 'name' || args[i] === 'displayId') {
                newPayload[args[i]] = oldPart[args[i]];
              }
            } else {

              // Otherwise include payload value.
              newPayload[args[i]] = request.payload[args[i]];
            }
          }

          // Create a new Part object.
          var newRequest = {
            url: '/api/part',
            method: 'POST',
            payload: newPayload,
            credentials: request.auth.credentials
          };


          server.inject(newRequest, (response) => {

            if (response.statusCode !== 200) {
              return reply(response.result);
            }

            done(null, response.result);

          });

        }], // TODO: update bioDesign link to Version!
        versionUpdate: ['createNewPart', function (results, done) {

          var versionResults = request.pre.checkVersion;
          var lastUpdatedId = versionResults[0];
          var versionNumber = versionResults[1];

          const userId = request.auth.credentials.user._id.toString();
          const oldId = lastUpdatedId;
          const partId = results.createNewPart;  // id of new Part.

          //change this to just updating the version --> because biodesign is creating the version
          if (lastUpdatedId !== null)
          {
            Version.updateMany({
              objectId: ObjectID(partId), //update new version number
              $isolated: 1
            }, {$set: {versionNumber: versionNumber + 1}}, (err, results) => {

              if (err) {
                return reply(err);
              }


              Version.updateMany({
                objectId: ObjectID(oldId), //update old replacement id
                $isolated: 1
              }, {$set: {replacementVersionId: partId}}, (err, results) => {


                if (err) {
                  return reply(err);
                }


                done(null, results);
              });
            });
          } else {
            done(null, results);
          }
        }],
        // markForDelete: ['versionUpdate', function (results, done) {
        //
        //   BioDesign.findByIdAndUpdate(request.params.id, {toDelete: true}, done);
        //
        // }]
      }, (err, result) => {

        if (err) {
          return err;
        }
        return reply(result['createNewPart']) //returns new bioDesginId
      });

    }
  });

  /**
   * @api {delete} /api/part/:id Delete Part by Id
   * @apiName  Delete Part by Id
   * @apiDescription Marks Part to be delete, removes it from being searched
   * @apiGroup Convenience Methods
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} id Part unique ID. (BioDesign ID)
   * @apiParamExample {String} id:
   * 596f9356be72299b8b10310e
   *
   * @apiSuccessExample {json} Success-Response:
   * {"message": "Success."}
   *
   */
  server.route({
    method: 'DELETE',
    path: '/part/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Async.auto({
        BioDesign: function (callback) {

          BioDesign.getBioDesign(request.params.id, false, (err, bioDesign) => {

            if (err) {
              return callback(err);
            }

            BioDesign.findById(request.params.id, (err, document) => {

              if (err) {
                return callback(err);
              }

              var dataModel = {};
              dataModel.subparts = bioDesign.subparts;
              dataModel.parameters = bioDesign.parameters;
              dataModel.modules = bioDesign.modules;

              BioDesign.delete(document, (err, result) => {
              });
              callback(null, dataModel);
            });
          });
        },
        Parameters: ['BioDesign', function (results, callback) {

          for (var parameter of results.BioDesign.parameters) {
            Parameter.delete(parameter, (err, results) => {
            });
          }
          callback(null, '');
        }],
        Modules: ['BioDesign', function (results, callback) {

          for (var module of results.BioDesign.modules) {
            for(var feature of module.features) {
              Feature.delete(feature, (err, results) => {});
            }
            delete module.features;
            Module.delete(module, (err, results) => {});
          }
          callback(null, '');
        }],
        Parts: ['BioDesign', function (results, callback) {

          for (var part of results.BioDesign.subparts) {
            for (var sequence of part.sequences) {
              for (var annotation of sequence.annotations) {
                for (var feature of annotation.features) {
                  Feature.delete(feature, (err, callback) => {
                  });
                }
                delete annotation.features;
                Annotation.delete(annotation, (err, callback) => {
                });
              }
              delete sequence.annotations;
              Sequence.delete(sequence, (err, callback) => {
              });
            }
            delete part.sequences;
            Part.delete(part, (err, callback) => {
            });
          }
          callback(null, '');
        }]
      }, (err, result) => {

        if (err) {
          return reply(err);
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
  name: 'part'
};
