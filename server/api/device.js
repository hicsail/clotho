'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
const ObjectID = require('mongo-models').ObjectID;

const internals = {};

internals.applyRoutes = function (server, next) {

  const BioDesign = server.plugins['hapi-mongo-models'].BioDesign;
  const Part = server.plugins['hapi-mongo-models'].Part;
  const Assembly = server.plugins['hapi-mongo-models'].Assembly;
  const Sequence = server.plugins['hapi-mongo-models'].Sequence;
  const Feature = server.plugins['hapi-mongo-models'].Feature;
  const Module = server.plugins['hapi-mongo-models'].Module;
  const Parameter = server.plugins['hapi-mongo-models'].Parameter;
  const Annotation = server.plugins['hapi-mongo-models'].Annotation;
  const Role = server.plugins['hapi-mongo-models'].Role;
  const Version = server.plugins['hapi-mongo-models'].Version;
  const User = server.plugins['hapi-mongo-models'].User;



  /**
   * @api {put} /api/device/update/:id Update Device by Id
   * @apiName  Update Device by Id
   * @apiDescription Include arguments in payload to update device.
   * @apiGroup Convenience Methods Device
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} name  name of device.
   * @apiParam {String} [displayId]  displayId of device.
   * @apiParam {String} [role]  role of the feature
   * @apiParam (Object) [parameters] can include "name", "units", "value", "variable"
   * @apiParam {String=ATUCGRYKMSWBDHVN} [sequence]  nucleotide sequence using nucleic acid abbreviation. Case-insensitive.
   * @apiParam {Boolean} [userSpace=false] If userspace is true, it will only filter by your bioDesigns
   *
   * @apiParamExample {json} Request-Example:
   *
   * ['name', 'partIds', 'createSeqFromParts', 'displayId', 'role', 'sequence', 'parameters'];
   *
   *
   * {
	"name": "BBa_E0040",
	"displayId": "green fluorescent protein derived from jellyfish",
	"partIds": ["596fa7165fe2743c2a5c4f76","596fa73a5fe2743c2a5c4f7d","597a0b98155a0466a37731ee"],
	"createSeqFromParts": "true",
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
   * 5984ea39dcf2bd8b22714905
   *
   * @apiErrorExample {json} Error-Response 1 - Invalid part id:
   {
    "statusCode": 404,
    "error": "Not Found",
    "message": "Document not found."
    }
   *
   *@apiErrorExample {json} Error-Response 2 - Invalid role:
   * {
   *  "statusCode": 400,
   *  "error": "Bad Request",
   *  "message": "Role invalid."
   *  }
   *
   *@apiErrorExample {json} Error-Response 3 - Invalid device id:
   {
    "statusCode": 404,
    "error": "Not Found",
    "message": "Device does not exist."
   }
   *
   *
   */


  server.route({
    method: 'PUT',
    path: '/device/update/{id}',
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
      },
      {
        assign: 'checkBioDesign',
        method: function (request, reply) {

          // Check that biodesign exists - should not perform update if biodesign does not exist.
          var bioDesignId = request.params.id;

          BioDesign.find({_id: ObjectID(bioDesignId), type: 'DEVICE'}, (err, results) => {

            if (err) {
              return reply(err);
            } else if (results === null || results.length === 0) {
              return reply(Boom.notFound('Device does not exist.'));
            } else {
              reply(true);
            }
          });
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
          name: Joi.string().optional(),
          displayId: Joi.string().optional(),
          role: Joi.string().uppercase().optional(),
          sequence: Joi.string().insensitive().optional(),
          partIds: Joi.array().items(Joi.string().required()).optional(),
          createSeqFromParts: Joi.boolean().required(),
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

      Async.auto({

        //get most updated ID
        getOldDevice: function (done) {

          var versionResults = request.pre.checkVersion;
          var lastUpdatedId = versionResults[0];  //returns current id, if no newer version

          BioDesign.getBioDesignIds(lastUpdatedId, null, 'DEVICE', done);
        },
        createNewPart: ['getOldDevice', function (results, done) {

          // Build up appropriate payload for part creation.
          const args = ['name', 'partIds', 'createSeqFromParts', 'displayId', 'role', 'sequence', 'parameters'];
          var newPayload = {};
          var oldDevice = results.getOldDevice[0];

          for (var i = 0; i < args.length; ++i) {

            // If argument in payload was null, retrieve value from old Part.


            if (request.payload[args[i]] === undefined || request.payload[args[i]] === null) {
              // add if statements for parameters that may not exist (see role)
              if (args[i] === 'sequence') {
                if (oldDevice['subparts'][0]['sequences'] !== undefined && oldDevice['subparts'][0]['sequences'] !== null) {
                  newPayload.sequence = oldDevice['subparts'][0]['sequences'][0]['sequence'];
                }
              }
              else if (args[i] === 'role') {
                if (oldDevice['modules'] !== undefined && oldDevice['modules'] !== null && oldDevice['modules'].length !== 0) {
                  newPayload.role = oldDevice['modules'][0]['role'];
                }
              } else if (args[i] === 'parameters') {
                // Loop through old parameters value
                if (oldDevice['parameters'].length !== 0 && oldDevice['parameters'] !== null && oldDevice['parameters'] !== undefined) {

                  var oldParameters = oldDevice['parameters'];
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
              } else if (args[i] === 'partIds') {
                newPayload[args[i]] = oldDevice['subBioDesignIds'];
              } else if (args[i] === 'name' || args[i] === 'displayId') {
                if (oldDevice[args[i]] !== null && oldDevice[args[i]] !== undefined) {
                  newPayload[args[i]] = oldDevice[args[i]];
                }
              }
            } else {

              // Otherwise include payload value.
              newPayload[args[i]] = request.payload[args[i]];
            }
          }

          // Create a new Device object.
          var newRequest = {
            url: '/api/device',
            method: 'POST',
            payload: newPayload,
            credentials: request.auth.credentials
          };

          server.inject(newRequest, (response) => {

            if (response.statusCode !== 200) {
              return reply(response.result);
            }

            done(null, response.result); //returns new bioDesignId

          });

        }],
        versionUpdate: ['createNewPart', function (results, done) {

          var versionResults = request.pre.checkVersion;
          var lastUpdatedId = versionResults[0];
          var versionNumber = versionResults[1];

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
        return reply(result['createNewPart']); //returns new bioDesginId
      });
    }
  });



  /**
   * @api {put} /api/put
   * @apiName Search for Device
   * @apiDescription Get BioDesignId of Device based on arguments.
   * @apiGroup Convenience Methods Device
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} [name]  name of device.
   * @apiParam {String} [displayId]  displayId of part.
   * @apiParam {String} [role]  role of the feature
   * @apiParam {String=ATUCGRYKMSWBDHVN} [sequence]  nucleotide sequence using nucleic acid abbreviation. Case-insensitive.
   * @apiParam (Object) [parameters] can include "name", "units", "value", "variable"
   * @apiParam {Boolean} [userSpace=false] If userspace is true, it will only filter by your bioDesigns
   * @apiParam {Boolean} [searchDeleted=false] whether to search for only deleted parts (true) or only non-deleted parts (false).
   * @apiParam {String} [createSeqFromParts]  boolean to differentiate device from part - may not be necessary
   * @apiParam (Object) [partIds]  list of partIds
   *
   *
   * @apiParamExample {json} Request-Example:
   *  {
      "name": "findDeviceTest",
      "partIds": ["598c9bfd7484ecafae736f7f","598c95e9573864af4720caec","597a0b98155a0466a37731ee"]
    }
   *
   * @apiSuccessExample {json} Success-Response:
   *
   [
   "598c9c157484ecafae736f88",
   "598c9c217484ecafae736f9b"
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
    path: '/device',
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
          userId: Joi.string().optional(),
          displayId: Joi.string().optional(),
          role: Joi.string().optional(),
          partIds: Joi.array().items(Joi.string().required()).optional(),
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

          var partIdsFromSequence = [];
          var partIds = [];
          var partIdsTotal = [];

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
              Part.getByParts(partIdsTotal, {toDelete: true}, done);
            } else {
              Part.getByParts(partIdsTotal, {toDelete: null}, done);
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
          } else if (results.findParts === null && (request.payload.sequence !== undefined || request.payload.partIds !== undefined)) {
            setBDs.push([]);
          }

          if (results.findParameters !== null){
            setBDs.push(results.findParameters);
          } else if (results.findParameters === null && request.payload.parameters !== undefined) {
            setBDs.push([]);
          }

          if (results.findModules !== null){
            setBDs.push(results.findModules);
          } else if (results.findModules === null && request.payload.role !== undefined) {
            setBDs.push([]);
          }

          for (var i = 0; i < setBDs.length; ++i) {
            if (i !== setBDs.length - 1) {                      //if there exists i+1,
              setBDs[i+1] = setBDs[i].filter(function (item) {  // i+1 equals to the intersect of i and i+1

                return setBDs[i+1].indexOf(item) != -1;
              });
            } else {
              intersectBDs = setBDs[i];   //last in setBDs is the intersect of all inputs
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

          //For multiple partIds or single partId
          if (request.payload.partIds !== undefined) {
            query['subBioDesignIds'] = request.payload.partIds;
          }

          // Should return everything if all arguments are empty.
          if (request.payload.name === undefined && request.payload.displayId === undefined
            && request.payload.sequence === undefined && request.payload.parameters === undefined
            && request.payload.role === undefined && request.payload.partIds === undefined) {
            return BioDesign.find(); //change this to a list of bioDesignIds
          }

          else if (Object.keys(query).length === 0) { //if there's no query for the bioDesign object
            done (null, intersectBDs);
          }

          else if (request.payload.sequence === undefined && request.payload.parameters === undefined
            && request.payload.role === undefined) {

            return BioDesign.getBioDesignIdsByQuery([], query, done);
          }

          // If prior steps have yielded nothing but at least one argument has been non-null, should return.
          else if (((request.payload.sequence !== undefined) || (request.payload.parameters !== undefined) || (request.payload.role !== undefined) ) && intersectBDs.length === 0) {
            done(null, []);

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
   * @api {put} /api/device/:filter Get Device With Filter
   * @apiName Get Device With Filter
   * @apiDescription Get attribute of a part based on arguments. Valid filters include parameters, modules, subparts,
   * sequences, annotations, features, assemblies, subdesigns, subannotations. Note that using the filters will return
   *  the bioDesign object as well, unless using name or _id.
   * @apiGroup Convenience Methods Device
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String=parameters modules subparts sequences annotations features assemblies subdesigns subannotations name _id} filter
   * @apiParam {String} [name]  name of device.
   * @apiParam {String} [displayId]  displayId of part.
   * @apiParam {String} [role]  role of the feature
   * @apiParam {String=ATUCGRYKMSWBDHVN} [sequence]  nucleotide sequence using nucleic acid abbreviation. Case-insensitive.
   * @apiParam (Object) [parameters] can include "name", "units", "value", "variable"
   * @apiParam {Boolean} [userSpace=false] If userspace is true, it will only filter by your bioDesigns
   * @apiParam (Object) [parameters] can include "name", "units", "value", "variable"
   * @apiParam {String} [createSeqFromParts]  boolean to differentiate device from part - may not be necessary
   * @apiParam (Object) [partIds]  list of partIds
   *
   *
   * @apiParamExample {json} Request-Example:
   *  {
       "name": "findDeviceTest"
       }

   * @apiSuccessExample {json} Success-Response (for api/device/parameters):
   *
   * [
     [
     {
         "_id": "598c9c157484ecafae736f88",
         "name": "findDeviceTest0",
         "description": null,
         "userId": "593f0d81b59d9120de14d897",
         "displayId": null,
         "imageURL": null,
         "subBioDesignIds": [
             "598c9bfd7484ecafae736f7f",
             "598c95e9573864af4720caec",
             "597a0b98155a0466a37731ee"
         ],
         "superBioDesignId": null,
         "type": "DEVICE"
     },
     {
         "_id": "598c9c157484ecafae736f8b",
         "subBioDesignIds": [
             "598c9bfd7484ecafae736f7f",
             "598c95e9573864af4720caec",
             "597a0b98155a0466a37731ee"
         ],
         "userId": "593f0d81b59d9120de14d897",
         "superSubPartId": "598c9c157484ecafae736f8a"
     }
     ],
     [
     {
         "_id": "598c9c217484ecafae736f9b",
         "name": "findDeviceTest1",
         "description": null,
         "userId": "593f0d81b59d9120de14d897",
         "displayId": null,
         "imageURL": null,
         "subBioDesignIds": [
             "598c9bfd7484ecafae736f7f",
             "598c9c1b7484ecafae736f92",
             "597a0b98155a0466a37731ee"
         ],
         "superBioDesignId": null,
         "type": "DEVICE"
     },
     {
         "_id": "598c9c217484ecafae736f9e",
         "subBioDesignIds": [
             "598c9bfd7484ecafae736f7f",
             "598c9c1b7484ecafae736f92",
             "597a0b98155a0466a37731ee"
         ],
         "userId": "593f0d81b59d9120de14d897",
         "superSubPartId": "598c9c217484ecafae736f9d"
     }
     ]
     ]
  *
  * @apiSuccessExample {json} name:
  *  device1,device2,device3
   *
  * @apiSuccessExample {json} name:
  *  598c9c217484ecafae736f9e,597a0b98155a0466a37731ee,598c9bfd7484ecafae736f7f
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
    path: '/device/{filter}',
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
              'assemblies', 'subdesigns', 'subannotations','name', '_id').required()
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
          userSpace: Joi.boolean().default(false)
        }
      }
    },
    handler: function (request, reply) {

      Async.auto({

        getPut: function (done) {

          var newRequest = {
            url: '/api/device',
            method: 'PUT',
            payload: request.payload,
            credentials: request.auth.credentials
          };

          server.inject(newRequest, (response) => {

            // Check for error. Includes no document found error.
            if (response.statusCode !== 200) {
              return reply(response.result);
            }
            done(null, response.result);
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

          const filter =  request.params.filter;
          var bioDesigns = results.getBioDesign;
          var filteredArr = [];

          for (let bigPart in bioDesigns) {
            var filteredObj = [null, null];

            //get filter object
            if (filter === 'parameters') {
              filteredObj[1] = bioDesigns[bigPart]['parameters'][0];
            }
            else if (filter === 'subdesigns') {
              filteredObj[1] = bioDesigns[bigPart]['subdesigns'];
            }
            else if (filter === 'modules') {
              filteredObj[1] = bioDesigns[bigPart]['modules'][0];
              delete filteredObj[1]['features'];
            }
            else if (filter === 'subparts') {
              filteredObj[1] = bioDesigns[bigPart]['subparts'][0];
              delete filteredObj[1]['assemblies'];
              delete filteredObj[1]['sequences'];
            }
            else if (filter === 'assemblies') {
              filteredObj[1] = bioDesigns[bigPart]['subparts'][0]['assemblies'][0];
            }
            else if (filter === 'sequences') {
              filteredObj[1] = bioDesigns[bigPart]['subparts'][0]['sequences'][0];
              delete filteredObj[1]['subannotations'];
              delete filteredObj[1]['annotations'];
            }
            else if (filter === 'subannotations') {
              filteredObj[1] = bioDesigns[bigPart]['subparts'][0]['sequences'][0]['subannotations'];
            }
            else if (filter === 'annotations') {
              filteredObj[1] = bioDesigns[bigPart]['subparts'][0]['sequences'][0]['annotations'][0];
              delete filteredObj[1]['features'];
            }
            else if (filter === 'features') {
              filteredObj[1] = bioDesigns[bigPart]['modules'][0]['features'][0];
            } else if (filter === 'name') {
              filteredObj[1] = bioDesigns[bigPart]['name'];
            } else if (filter === '_id') {
              filteredObj[1] = bioDesigns[bigPart]['_id'].toString();
            }

            if(filter !== 'name' && filter !== '_id') {
              //get bioDesign object
              filteredObj[0] = bioDesigns[bigPart];
              delete filteredObj[0]['parameters'];
              delete filteredObj[0]['modules'];
              delete filteredObj[0]['subparts'];
              delete filteredObj[0]['subdesigns'];

              filteredArr.push(filteredObj);
            } else {
              filteredArr.push(filteredObj[1]);
            }

          }

          if (filteredArr.length > 0 && typeof filteredArr[0] === 'string') {
            return reply(filteredArr.join());
          } else {
            return reply(filteredArr);
          }
        }]
      });
    }
  });






  /**
   * @api {post} /api/device Get Device
   * @apiName Get Device
   * @apiDescription Get device based on bioDesignId
   * @apiGroup Convenience Methods Device
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} name  name of part.
   * @apiParam {String} [displayId]  displayId of part.
   * @apiParam {String} [userId]  id of user.
   * @apiParam {String} [role]  role of the feature
   * @apiParam (Object) [parameters] can include "name", "units", "value", "variable"
   * @apiParam {String} [createSeqFromParts]  boolean to differentiate device from part - may not be necessary
   * @apiParam (Object) [partIds]  list of partIds
   *
   * @apiParamExample {json} Request-Example:
   * http://localhost:9000/api/device/59764361b06d2654210a7895
   *
   * @apiSuccessExample {string} Success-Response:
   *
   [{
       "_id": "59764361b06d2654210a7895",
       "name": "B001",
       "description": null,
       "userId": "593f0d81b59d9120de14d897",
       "displayId": "sample",
       "imageURL": null,
       "subBioDesignIds": [
           "596fa7165fe2743c2a5c4f76",
           "596fa73a5fe2743c2a5c4f7d",
           "5963d15239f53707ea81993a"
       ],
       "superBioDesignId": null,
       "type": "DEVICE",
       "subparts": [
           {
               "_id": "59764361b06d2654210a7898",
               "name": "B001",
               "description": null,
               "userId": "593f0d81b59d9120de14d897",
               "displayId": "sample",
               "bioDesignId": "59764361b06d2654210a7895",
               "assemblies": [
                   {
                       "_id": "59764361b06d2654210a7899",
                       "subBioDesignIds": [
                           "596fa7165fe2743c2a5c4f76",
                           "596fa73a5fe2743c2a5c4f7d",
                           "5963d15239f53707ea81993a"
                       ],
                       "userId": "593f0d81b59d9120de14d897",
                       "superSubPartId": "59764361b06d2654210a7898"
                   }
               ],
               "sequences": [
                   {
                       "_id": "59764361b06d2654210a789a",
                       "name": "B001",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "featureId": "59764361b06d2654210a789f",
                       "partId": "59764361b06d2654210a7898",
                       "sequence": "DDDDDDDDDDDDDGGGGGGGGGGCCCCCCCC",
                       "isLinear": null,
                       "isSingleStranded": null,
                       "subannotations": [
                           {
                               "_id": "59764361b06d2654210a789b",
                               "name": "B001",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "sequenceId": null,
                               "superSequenceId": "59764361b06d2654210a789a",
                               "start": 1,
                               "end": 13,
                               "isForwardStrand": true
                           },
                           {
                               "_id": "59764361b06d2654210a789c",
                               "name": "B001",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "sequenceId": null,
                               "superSequenceId": "59764361b06d2654210a789a",
                               "start": 14,
                               "end": 23,
                               "isForwardStrand": true
                           },
                           {
                               "_id": "59764361b06d2654210a789d",
                               "name": "B001",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "sequenceId": null,
                               "superSequenceId": "59764361b06d2654210a789a",
                               "start": 24,
                               "end": 31,
                               "isForwardStrand": true
                           }
                       ],
                       "annotations": [
                           {
                               "_id": "59764361b06d2654210a789e",
                               "name": "B001",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "sequenceId": "59764361b06d2654210a789a",
                               "superSequenceId": null,
                               "start": 1,
                               "end": 31,
                               "isForwardStrand": true,
                               "features": [
                                   {
                                       "_id": "59764361b06d2654210a789f",
                                       "name": "B001",
                                       "description": null,
                                       "userId": "593f0d81b59d9120de14d897",
                                       "displayId": "sample",
                                       "role": "MODULE",
                                       "annotationId": "59764361b06d2654210a789e",
                                       "superAnnotationId": null,
                                       "moduleId": "59764361b06d2654210a7897"
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
               "_id": "59764361b06d2654210a7897",
               "name": "B001",
               "description": null,
               "userId": "593f0d81b59d9120de14d897",
               "displayId": "sample",
               "bioDesignId": "59764361b06d2654210a7895",
               "role": "MODULE",
               "submoduleIds": null,
               "features": [
                   {
                       "_id": "59764361b06d2654210a789f",
                       "name": "B001",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "role": "MODULE",
                       "annotationId": "59764361b06d2654210a789e",
                       "superAnnotationId": null,
                       "moduleId": "59764361b06d2654210a7897"
                   }
               ]
           }
       ],
       "parameters": [
           {
               "_id": "59764361b06d2654210a7896",
               "name": null,
               "userId": "593f0d81b59d9120de14d897",
               "bioDesignId": "59764361b06d2654210a7895",
               "value": 20,
               "variable": "cm",
               "units": null
           }
       ],
       "subdesigns": [
           {
               "_id": "5963d15239f53707ea81993a",
               "name": "TEST3",
               "description": null,
               "userId": "593f0d81b59d9120de14d897",
               "displayId": "sample",
               "imageURL": null,
               "subBioDesignIds": null,
               "superBioDesignId": "59776aea15d1c358a3f2940b",
               "subparts": [
                   {
                       "_id": "5963d15239f53707ea81993d",
                       "name": "TEST3",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "bioDesignId": "5963d15239f53707ea81993a",
                       "assemblyId": "59776aea15d1c358a3f2940f",
                       "sequences": [
                           {
                               "_id": "5963d15239f53707ea81993e",
                               "name": "TEST3",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "displayId": "sample",
                               "featureId": "5963d15239f53707ea819940",
                               "partId": "5963d15239f53707ea81993d",
                               "sequence": "CCCCCCCC",
                               "isLinear": null,
                               "isSingleStranded": null,
                               "annotations": [
                                   {
                                       "_id": "5963d15239f53707ea81993f",
                                       "name": "TEST3",
                                       "description": null,
                                       "userId": "593f0d81b59d9120de14d897",
                                       "sequenceId": "5963d15239f53707ea81993e",
                                       "start": 1,
                                       "end": 8,
                                       "isForwardStrand": true,
                                       "features": [
                                           {
                                               "_id": "5963d15239f53707ea819940",
                                               "name": "TEST3",
                                               "description": null,
                                               "userId": "593f0d81b59d9120de14d897",
                                               "displayId": "sample",
                                               "role": "PROMOTER",
                                               "annotationId": "5963d15239f53707ea81993f",
                                               "moduleId": "5963d15239f53707ea81993c",
                                               "superAnnotationId": "59776aea15d1c358a3f29413"
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
                       "_id": "5963d15239f53707ea81993c",
                       "name": "TEST3",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "bioDesignId": "5963d15239f53707ea81993a",
                       "role": "PROMOTER",
                       "submoduleIds": null,
                       "features": [
                           {
                               "_id": "5963d15239f53707ea819940",
                               "name": "TEST3",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "displayId": "sample",
                               "role": "PROMOTER",
                               "annotationId": "5963d15239f53707ea81993f",
                               "moduleId": "5963d15239f53707ea81993c",
                               "superAnnotationId": "59776aea15d1c358a3f29413"
                           }
                       ]
                   }
               ],
               "parameters": [
                   {
                       "_id": "5963d15239f53707ea81993b",
                       "name": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "bioDesignId": "5963d15239f53707ea81993a",
                       "value": 20,
                       "variable": "cm",
                       "units": null
                   }
               ]
           },
           {
               "_id": "596fa7165fe2743c2a5c4f76",
               "name": "secondTEST1",
               "description": null,
               "userId": "593f0d81b59d9120de14d897",
               "displayId": "sample",
               "imageURL": null,
               "subBioDesignIds": null,
               "superBioDesignId": "59776aea15d1c358a3f2940b",
               "type": "PART",
               "subparts": [
                   {
                       "_id": "596fa7165fe2743c2a5c4f79",
                       "name": "secondTEST1",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "bioDesignId": "596fa7165fe2743c2a5c4f76",
                       "assemblyId": "59776aea15d1c358a3f2940f",
                       "sequences": [
                           {
                               "_id": "596fa7165fe2743c2a5c4f7a",
                               "name": "secondTEST1",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "displayId": "sample",
                               "featureId": "596fa7165fe2743c2a5c4f7c",
                               "partId": "596fa7165fe2743c2a5c4f79",
                               "sequence": "DDDDDDDDDDDDD",
                               "isLinear": null,
                               "isSingleStranded": null,
                               "annotations": [
                                   {
                                       "_id": "596fa7165fe2743c2a5c4f7b",
                                       "name": "secondTEST1",
                                       "description": null,
                                       "userId": "593f0d81b59d9120de14d897",
                                       "sequenceId": "596fa7165fe2743c2a5c4f7a",
                                       "superSequenceId": null,
                                       "start": 1,
                                       "end": 13,
                                       "isForwardStrand": true,
                                       "features": [
                                           {
                                               "_id": "596fa7165fe2743c2a5c4f7c",
                                               "name": "secondTEST1",
                                               "description": null,
                                               "userId": "593f0d81b59d9120de14d897",
                                               "displayId": "sample",
                                               "role": "PROMOTER",
                                               "annotationId": "596fa7165fe2743c2a5c4f7b",
                                               "superAnnotationId": "59776aea15d1c358a3f29411",
                                               "moduleId": "596fa7165fe2743c2a5c4f78"
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
                       "_id": "596fa7165fe2743c2a5c4f78",
                       "name": "secondTEST1",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "bioDesignId": "596fa7165fe2743c2a5c4f76",
                       "role": "PROMOTER",
                       "submoduleIds": null,
                       "features": [
                           {
                               "_id": "596fa7165fe2743c2a5c4f7c",
                               "name": "secondTEST1",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "displayId": "sample",
                               "role": "PROMOTER",
                               "annotationId": "596fa7165fe2743c2a5c4f7b",
                               "superAnnotationId": "59776aea15d1c358a3f29411",
                               "moduleId": "596fa7165fe2743c2a5c4f78"
                           }
                       ]
                   }
               ],
               "parameters": [
                   {
                       "_id": "596fa7165fe2743c2a5c4f77",
                       "name": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "bioDesignId": "596fa7165fe2743c2a5c4f76",
                       "value": 300,
                       "variable": "cm",
                       "units": null
                   }
               ]
           },
           {
               "_id": "596fa73a5fe2743c2a5c4f7d",
               "name": "secondTEST2",
               "description": null,
               "userId": "593f0d81b59d9120de14d897",
               "displayId": "sample",
               "imageURL": null,
               "subBioDesignIds": null,
               "superBioDesignId": "59776aea15d1c358a3f2940b",
               "type": "PART",
               "subparts": [
                   {
                       "_id": "596fa73a5fe2743c2a5c4f80",
                       "name": "secondTEST2",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "bioDesignId": "596fa73a5fe2743c2a5c4f7d",
                       "assemblyId": "59776aea15d1c358a3f2940f",
                       "sequences": [
                           {
                               "_id": "596fa73a5fe2743c2a5c4f81",
                               "name": "secondTEST2",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "displayId": "sample",
                               "featureId": "596fa73a5fe2743c2a5c4f83",
                               "partId": "596fa73a5fe2743c2a5c4f80",
                               "sequence": "GGGGGGGGGG",
                               "isLinear": null,
                               "isSingleStranded": null,
                               "annotations": [
                                   {
                                       "_id": "596fa73a5fe2743c2a5c4f82",
                                       "name": "secondTEST2",
                                       "description": null,
                                       "userId": "593f0d81b59d9120de14d897",
                                       "sequenceId": "596fa73a5fe2743c2a5c4f81",
                                       "superSequenceId": null,
                                       "start": 1,
                                       "end": 10,
                                       "isForwardStrand": true,
                                       "features": [
                                           {
                                               "_id": "596fa73a5fe2743c2a5c4f83",
                                               "name": "secondTEST2",
                                               "description": null,
                                               "userId": "593f0d81b59d9120de14d897",
                                               "displayId": "sample",
                                               "role": "PROMOTER",
                                               "annotationId": "596fa73a5fe2743c2a5c4f82",
                                               "superAnnotationId": "59776aea15d1c358a3f29412",
                                               "moduleId": "596fa73a5fe2743c2a5c4f7f"
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
                       "_id": "596fa73a5fe2743c2a5c4f7f",
                       "name": "secondTEST2",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "bioDesignId": "596fa73a5fe2743c2a5c4f7d",
                       "role": "PROMOTER",
                       "submoduleIds": null,
                       "features": [
                           {
                               "_id": "596fa73a5fe2743c2a5c4f83",
                               "name": "secondTEST2",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "displayId": "sample",
                               "role": "PROMOTER",
                               "annotationId": "596fa73a5fe2743c2a5c4f82",
                               "superAnnotationId": "59776aea15d1c358a3f29412",
                               "moduleId": "596fa73a5fe2743c2a5c4f7f"
                           }
                       ]
                   }
               ],
               "parameters": [
                   {
                       "_id": "596fa73a5fe2743c2a5c4f7e",
                       "name": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "bioDesignId": "596fa73a5fe2743c2a5c4f7d",
                       "value": 0.03,
                       "variable": "cm",
                       "units": null
                   }
               ]
           }
       ]
   }
   ]
   *
   * @apiErrorExample
   *
   * TBD
   */


  server.route({
    method: 'GET',
    path: '/device/{id}',
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
      var lastUpdatedId = versionResults[0];  //returns current id, if no newer version

      BioDesign.getBioDesignIds(lastUpdatedId, null, null, (err, bioDesign) => {

        if (err) {
          return reply(err);
        }

        if (!bioDesign || bioDesign.length === 0) {
          return reply(Boom.notFound('Document not found.'));
        }

        let id = bioDesign[0].userId;

        User.findById(id, User.fieldsAdapter('username name'),(err, user) => {

          bioDesign[0].user = user;

          return reply(bioDesign);

        });
      });
    }
  });


  /**
   * @api {post} /api/device Create Device
   * @apiName Create Device
   * @apiDescription Create device based on arguments and part ids
   * @apiGroup Convenience Methods Device
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} name  name of part.
   * @apiParam {String} [displayId]  displayId of part.
   * @apiParam {String} [userId]  id of user.
   * @apiParam {String} [role]  role of the feature
   * @apiParam (Object) [parameters] can include "name", "units", "value", "variable"
   * @apiParam {String} [createSeqFromParts]  boolean to differentiate device from part - may not be necessary
   * @apiParam (Object) [partIds]  list of partIds
   *
   * @apiParamExample {json} Request-Example:
   *
   {
       "name": "B001",
       "parameters": [
           {"value": 20,
           "variable": "cm"
           }
       ],
       "role": "MODULE",
       "displayId": "sample",
       "createSeqFromParts": "true",
       "partIds": ["596fa7165fe2743c2a5c4f76","596fa73a5fe2743c2a5c4f7d","596fa74b5fe2743c2a5c4f84"]
   }
   *
   * List of partIds was compiled from creating parts and collecting their bioDesignIds.
   * Replace with bioDesignIds from locally created parts
   *
   * @apiSuccessExample {string} Success-Response:
   * 596fb1a516da153d08ed51b0
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
    path: '/device',
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
          userId: Joi.string().optional(),
          displayId: Joi.string().optional(),
          role: Joi.string().uppercase().optional(),
          partIds: Joi.array().items(Joi.string().required()).required(),
          sequence: Joi.string().insensitive().optional(),
          createSeqFromParts: Joi.boolean().required(),
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
            'DEVICE', //type
            request.auth.credentials.session.application.toString(), //application
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

                BioDesign.findOneAndUpdate({
                  _id: ObjectID(subBioDesignIds[i]),
                  $isolated: 1
                }, {$set: {superBioDesignId: superBioDesignId}}, (err, results) => {

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


          if (request.payload.sequence === undefined || request.payload.sequence === null) {
            // Need to update subparts that belong to subdesigns
            // so that they have new assemblyId associated
            var assemblyId = results.createAssembly._id.toString();
            var subBioDesignIds = request.payload.partIds;

            if (subBioDesignIds !== undefined && subBioDesignIds !== null) {
              var allPromises = [];


              for (var i = 0; i < subBioDesignIds.length; ++i) {
                var promise = new Promise((resolve, reject) => {

                  Part.updateMany({
                    bioDesignId: subBioDesignIds[i],
                    $isolated: 1
                  }, {$set: {assemblyId: assemblyId}}, (err, results) => {

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
          }
          else {
            return done(null, []);
          }
        }],
        getSubSubPartIds: ['createSubpart', function (results, done) {


          if (request.payload.sequence === undefined || request.payload.sequence === null) {

            var subBioDesignIds = request.payload.partIds;
            var allPromises = [];
            var subSubPartIds = {};

            for (var i = 0; i < subBioDesignIds.length; ++i) {
              var promise = new Promise((resolve, reject) => {

                //sends value i to function so that order is kept track of
                Part.findByBioDesignIdOnly(i, subBioDesignIds[i], (err, results) => {

                  if (err) {
                    reject(err);


                  } else {

                    var key = results[0];  //i is returned here, partId is saved under i
                    var resPart = results[1];

                    // if (resPart.length !== 0) {
                    var subSubPartId = resPart[0]['_id'];
                    subSubPartIds[key] = subSubPartId;
                    // }
                    // else {
                    //   done(null, key)
                    // }
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
              done(null, subSubPartIds);
            });
          }
          else {
            return done(null, []);
          }
        }],
        getSequences: ['createSubpart', 'getSubSubPartIds', function (results, done) {

          if (request.payload.sequence === undefined || request.payload.sequence === null) {

            //get all subSequences!
            var subSubPartIds = results.getSubSubPartIds;
            var subBioDesignIds = request.payload.partIds;
            var allPromises = [];

            //array for exact length created to
            var subSequenceIds = Array.apply(null, Array(subBioDesignIds.length)).map(String.prototype.valueOf, '0');
            var superSequenceArr = Array.apply(null, Array(subBioDesignIds.length)).map(String.prototype.valueOf, '0');
            var subFeatureIds = Array.apply(null, Array(subBioDesignIds.length)).map(String.prototype.valueOf, '0');

            for (var i = 0; i < subBioDesignIds.length; ++i) {
              var promise = new Promise((resolve, reject) => {

                //sends value i to function so that order is kept track of
                Sequence.findByPartIdOnly(i, subSubPartIds[i], (err, results) => {

                  if (err) {
                    return reject(err);
                  }
                  else if (results[1].length == 0) {
                    var key = results[0];
                    superSequenceArr[key] = null; //null string
                    subSequenceIds[key] = null;
                    subFeatureIds[key] = null;

                    resolve(results);
                  }

                  else {
                    var key2 = results[0];
                    superSequenceArr[key2] = results[1][0]['sequence'];
                    subSequenceIds[key2] = results[1][0]['_id'];
                    subFeatureIds[key2] = results[1][0]['featureId'];

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
              done(null, [subSequenceIds, superSequenceArr, subFeatureIds]);
            });
          }
          else {
            return done(null, []);
          }
        }],
        createSequence: ['createSubpart', 'getSequences', function (results, done) {

          if (request.payload.sequence === undefined || request.payload.sequence === null) {

            //get all subSequences and concatenates them to create the superSequence!
            var partId = results.createSubpart._id.toString();
            var sequences = results.getSequences;

            var superSequenceArr = sequences[1];
            //var subBioDesignIds = request.payload.partIds;

            var superSequence = superSequenceArr.join('');

            Sequence.create(
              request.payload.name,
              null, // no description
              request.auth.credentials.user._id.toString(),
              request.payload.displayId,
              null, // featureId null
              partId,
              superSequence, //combination of sequences
              null,//isLinear
              null,//isSingleStranded
              done);
          }
          else {
            return done(null, []);
          }
        }],
        createSubAnnotations: ['createSequence', 'getSequences', function (results, done) {

          if (request.payload.sequence === undefined || request.payload.sequence === null) {

            // Create subAnnotations for all subBioDesigns connected to subFeatures
            var superSequenceId = results.createSequence._id.toString();
            var superSequenceArr = results.getSequences[1];

            var allPromises = [];
            var position = 1; //sequences start at 1

            var subAnnotationIds = Array.apply(null, Array(superSequenceArr.length)).map(String.prototype.valueOf, '0');

            for (var i = 0; i < superSequenceArr.length; ++i) {

              if (superSequenceArr[i] !== null) {

                var promise = new Promise((resolve, reject) => {

                  var subSequence = superSequenceArr[i];
                  var subSequenceLength = subSequence.length;
                  var start = position;
                  var end = position + subSequenceLength - 1;
                  position = end + 1; //setup for next annotation

                  Annotation.createWithIndex(
                    i,
                    request.payload.name,
                    null, // description,
                    request.auth.credentials.user._id.toString(),
                    null, //sequenceId
                    superSequenceId, // superSequenceId
                    start, // start
                    end, // end
                    true, // isForwardString
                    (err, results) => {

                      if (err) {
                        reject(err);
                      } else {
                        var key = results[0];
                        //calling createDevice  multiple times will create multiple annotations per feature
                        //saving id of specific annotation when created is important!
                        subAnnotationIds[key] = results[1]._id.toString();
                        resolve(results[1]);
                      }
                    });
                });
              }
              allPromises.push(promise);
            }

            Promise.all(allPromises).then((resolve, reject) => {

              if (reject) {
                reply(reject);
              }
              done(null, subAnnotationIds);
            });
          }
          else {
            return done(null, []);
          }
        }],
        updateSubFeaturesSuperAnnotationId: ['getSequences', 'createSubAnnotations', function (results, done) {

          if (request.payload.sequence === undefined || request.payload.sequence === null) {

            // Update superAnnotationIds in order in all subFeatures
            //get featuresIds from getSequences and use to update subFeatureAnnotationIds

            var subFeatureIds = results.getSequences[2];
            var subAnnotationIds = results.createSubAnnotations;
            var allPromises = [];

            for (var i = 0; i < subFeatureIds.length; ++i) {

              var promise = new Promise((resolve, reject) => {

                Feature.findOneAndUpdate({
                  _id: ObjectID(subFeatureIds[i]),
                  $isolated: 1
                }, {$set: {superAnnotationId: subAnnotationIds[i]}}, (err, results) => {

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
          }
          else {
            return done(null, []);
          }
        }],
        createSequenceFromPayload: ['createSubpart', function (results, done) {

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
        createAnnotation: ['createSequence', 'createSequenceFromPayload', function (results, done) {

          var seq = '';
          var sequenceLength = 0;

          //if sequence was user defined, get it from createSequenceFromPayload. Else get it from createSequence.
          if (request.payload.sequence !== undefined && request.payload.sequence !== null) {
            seq = results.createSequenceFromPayload._id.toString();
            sequenceLength = results.createSequenceFromPayload.sequence.length;
          } else {
            seq = results.createSequence._id.toString();
            sequenceLength = results.createSequence.sequence.length;
          }

          if (sequenceLength !== undefined && request.payload.sequence !== null && sequenceLength !== 0) {

            Annotation.create(
              request.payload.name,
              null, // description,
              request.auth.credentials.user._id.toString(),
              seq, // sequenceId
              null, //superSequenceId - never updated, null indicates it is directly part of a part or device
              1, // start
              sequenceLength, // end
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
        }],
        updateSequenceFeatureId: ['createFeature', 'createSequence', 'createSequenceFromPayload', function (results, done) {

          if (results.createFeature) {
            var featureId = results.createFeature._id.toString();

            var sequenceId = '';

            //if sequence was user defined, get it from createSequenceFromPayload. Else get it from createSequence.
            if (request.payload.sequence !== undefined && request.payload.sequence !== null) {
              sequenceId = results.createSequenceFromPayload._id.toString();
            } else {
              sequenceId = results.createSequence._id.toString();
            }

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
        // return reply(results);
        return reply(results.createBioDesign._id.toString());
      });
    }
  });

  /**
   * @api {delete} /api/device/delete/:id Delete Device by Id
   * @apiName  Delete Device by Id
   * @apiDescription Adds Marks for deletion on part, not searchable
   * @apiGroup Convenience Methods Device
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} id Device unique ID. (BioDesign ID)
   * @apiParamExample {String} id:
   * 596f9356be72299b8b10310e
   *
   * @apiSuccessExample {json} Success-Response:
   * {"message": "Success."}
   *
   */
  server.route({
    method: 'DELETE',
    path: '/device/{id}',
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

          if(results.BioDesign.subparts) {
            for (var part of results.BioDesign.subparts) {
              if(part.sequences) {
                for (var sequence of part.sequences) {
                  if(sequence.annotations) {
                    for (var annotation of sequence.annotations) {
                      for (var feature of annotation.features) {
                        Feature.delete(feature, (err, callback) => {
                        });
                      }
                      delete annotation.features;
                      Annotation.delete(annotation, (err, callback) => {
                      });
                    }
                  }
                  if(sequence.subannotations) {
                    for(var subannotations of sequence.subannotations) {
                      Annotation.delete(subannotations, (err, callback) => {
                      });
                    }
                  }
                  delete sequence.subannotations;
                  delete sequence.annotations;
                  Sequence.delete(sequence, (err, callback) => {
                  });
                }
              }
              if(part.assemblies) {
                for(var assembly of part.assemblies) {
                  Assembly.delete(assembly, (err, callback) => {});
                }
              }
              delete part.assemblies;
              delete part.sequences;
              Part.delete(part, (err, callback) => {
              });
            }
          }
          callback(null, results.BioDesign.subparts);
        }]
      }, (err, result) => {

        if (err) {
          return reply(err);
        }

        reply({message: 'Success.'});
      });
    }
  });

  /**
   * @api {delete} /api/device/undelete/:id Un-Delete Device by Id
   * @apiName  Un-Delete Device by Id
   * @apiDescription Removes Marks for deletion on part, becomes searchable again
   * @apiGroup Convenience Methods Device
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} id Device unique ID. (BioDesign ID)
   * @apiParamExample {String} id:
   * 596f9356be72299b8b10310e
   *
   * @apiSuccessExample {json} Success-Response:
   * {"message": "Success."}
   *
   */
  server.route({
    method: 'DELETE',
    path: '/device/undelete/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Async.auto({
        BioDesign: function (callback) {

          BioDesign.findOne({
            _id: ObjectID(request.params.id),
            toDelete: true
          }, (err, document) => {

            if(document) {
              BioDesign.undelete(document, callback);
            } else {
              callback(Boom.notFound('No BioDesign Found to undelete'));
            }
          });
        },
        Parameters: ['BioDesign', function (results, callback) {

          Parameter.find({
            bioDesignId: request.params.id,
            toDelete: true
          }, (err, documents) => {

            Async.each(documents, function (parameter, callback) {

              Parameter.undelete(parameter, callback);
            }, (err) => {

              callback(err);
            });
          });
        }],
        Modules: ['BioDesign', function (results, callback) {

          Module.find({
            bioDesignId: request.params.id,
            toDelete: true
          }, (err, modules) => {

            Async.each(modules, function (module, callback) {

              Feature.find({
                moduleId: module._id.toString(),
                toDelete: true
              }, (err, features) => {

                Async.each(features, function (feature, callback) {

                  Feature.undelete(feature, callback);

                }, (err) => {

                  Module.undelete(module, callback);
                });
              });
            }, (err) => {

              callback(err, modules);
            });
          });
        }],
        Assembly: ['Parts', function (results, callback) {

          for(let part of results.Parts) {
            Assembly.find({
              superSubPartId: part._id.toString(),
              toDelete: true
            }, (err, assemblies) => {

              for(let assembly of assemblies) {

                Assembly.undelete(assembly, (err) => {

                });
              }
              callback(null, assemblies);
            });
          }
        }],
        Parts: ['BioDesign', function (results, callback) {

          Part.find({
            bioDesignId: request.params.id,
            toDelete: true
          }, (err, parts) => {

            Async.each(parts, function (part, callback) {

              Sequence.find({
                partId: part._id.toString(),
                toDelete: true
              }, (err, sequences) => {

                Async.each(sequences, function (sequence, callback) {

                  Annotation.find({
                    sequenceId: sequence._id.toString(),
                    toDelete: true
                  }, (err, annotations) => {

                    Async.each(annotations, function (annotation, callback) {

                      Feature.find({
                        annotationId: annotation._id.toString(),
                        toDelete: true
                      }, (err, features) => {

                        Async.each(features, function (feature, callback) {

                          Feature.undelete(feature, callback);
                        }, (err) => {

                          Annotation.undelete(annotation, callback);
                        }); //end each feature
                      });// feature find
                    }, (err) => {

                      Sequence.undelete(sequence, callback);
                    }); //end each annotation
                  });// annotation find
                }, (err) => {

                  Part.undelete(part, callback);
                }); //end each sequence
              });// sequence find
            }, (err) => {

              callback(err, parts);
            });// end for part
          });//part find
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
  name: 'device'
};
