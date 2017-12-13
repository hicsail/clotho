'use strict';
const Async = require('async');
const Boom = require('boom');
const Joi = require('joi');
const ObjectID = require('mongo-models').ObjectId;

const internals = {};

internals.applyRoutes = function (server, next) {

  const Sample = server.plugins['hapi-mongo-models'].Sample;
  const Parameter = server.plugins['hapi-mongo-models'].Parameter;

  server.route({
    method: 'GET',
    path: '/sample',
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

      Sample.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });


  /**
   * @api {get} /api/sample/:id Get Sample By Id
   * @apiName Get Sample By Id
   * @apiDescription Get Sample by ID
   * @apiGroup Sample
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} id Sample unique ID.
   * @apiParamExample {string} Example-Request:
   *59936768b33f2a43dc4254eb
   *
   * @apiSuccessExample {json} Success-Response:
   *
   * {
    "_id": "59936768b33f2a43dc4254eb",
    "name": "sample001",
    "description": "Initial sample",
    "userId": "5940442869431c24a06da157",
    "containerId": null,
    "bioDesignId": "5991f31409380a0f58ed92d9",
    "parameterIds": [
        "59936768b33f2a43dc4254ea"
    ],
    "parentSampleIds": [
        "5993674eb33f2a43dc4254e9"
    ]
}
   *
   @apiErrorExample {json} Error-Response:
   {
       "statusCode": 404,
       "error": "Not Found",
       "message": "Document not found."
   }

   */


  server.route({
    method: 'GET',
    path: '/sample/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Sample.findById(request.params.id, (err, sample) => {

        if (err) {
          return reply(err);
        }

        if (!sample) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(sample);
      });
    }
  });


  /**
   * @api {post} /api/sample Create Sample
   * @apiName Create Sample
   * @apiDescription Create Sample
   * @apiGroup Sample
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   *
   * @apiParam {String} name Sample name
   * @apiParam {String} [description] Sample description
   * @apiParam {String} bioDesignId Sample bioDesignId
   * @apiParam {Array} [parameterIds] An array of parameter ids (as strings) for the sample.
   * @apiParam {String} [containerId] Sample containerId
   * @apiParam {Array} [parentSampleIds] Ids (as strings) corresponding to parent samples.
   *
   * @apiParamExample {json} Example-Request:
   *{
	"name": "sample001",
	"description": "Initial sample",
	"bioDesignId": "5991f31409380a0f58ed92d9",
	"parameterIds": ["59936768b33f2a43dc4254ea"],
	"containerId": "598cd760d74bab2678e99324",
	"parentSampleIds": ["5993674eb33f2a43dc4254e9"]
}

   *
   *
   * @apiSuccessExample {json} Success-Response:
   *
   *
   * {
    "name": "sample001",
    "description": "Initial sample",
    "userId": "5940442869431c24a06da157",
    "bioDesignId": "5991f31409380a0f58ed92d9",
    "parameterIds": [
        "59936768b33f2a43dc4254ea"
    ],
    "containerId": "598cd760d74bab2678e99324",
    "parentSampleIds": [
        "5993674eb33f2a43dc4254e9"
    ],
    "_id": "59936768b33f2a43dc4254eb"
}

   *
   @apiErrorExample {json} Error-Response Name argument omitted:

   {
      "statusCode": 400,
      "error": "Bad Request",
      "message": "child \"name\" fails because [\"name\" is required]",
      "validation": {
          "source": "payload",
          "keys": [
              "name"
          ]
      }
  }

   @apiErrorExample {json} Error-Response BioDesignId argument omitted:

   {
       "statusCode": 400,
       "error": "Bad Request",
       "message": "child \"bioDesignId\" fails because [\"bioDesignId\" is required]",
       "validation": {
           "source": "payload",
           "keys": [
               "bioDesignId"
           ]
       }
   }
   */


  server.route({
    method: 'POST',
    path: '/sample',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: Sample.payload
      }
    },

    handler: function (request, reply) {

      Async.auto({
        parameters: function (callback) {

          let parameterIds = [];

          if(request.payload.parameters) {
            Async.each(request.payload.parameters, (parameter, done) => {

              const userId = request.auth.credentials.user._id.toString();

              Parameter.create(parameter.name,userId, request.payload.bioDesignId, parameter.value, parameter.variable, parameter.units, (err, p) => {

                parameterIds.push(p._id.toString());
                console.log(parameterIds);
                done();
              });
            }, (err) => {
              callback(null,parameterIds);
            });
          } else {
            parameterIds = request.payload.parameterIds;
            callback(null,parameterIds);
          }
        },
        sample: ['parameters', function (results, callback) {

          Sample.create(
            request.payload.name,
            request.payload.description,
            request.auth.credentials.user._id.toString(),
            request.payload.containerId,
            request.payload.bioDesignId,
            results.parameters,
            request.payload.parentSampleIds,
            callback);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        return reply(results.sample);
      });
    }
  });

  /**
   * @api {put} /api/sample/:id Update Sample
   * @apiName Update Sample
   * @apiDescription Update Sample By Id
   * @apiGroup Sample
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} name Sample name
   * @apiParam {String} [description] Sample description
   * @apiParam {String} bioDesignId Sample bioDesignId
   * @apiParam {Array} [parameterIds] An array of parameter ids (as strings) for the sample.
   * @apiParam {String} [containerId] Sample containerId
   * @apiParam {Array} [parentSampleIds] Array of ids as strings corresponding to parent samples.
   * @apiParamExample {json} Example-Request:
   *
   *
   * {
	"name": "sample 001",
	"description": "first sample",
	"bioDesignId": "5991f31409380a0f58ed92d9",
	"parameterIds": ["59936768b33f2a43dc4254ea"],
	"parentSampleIds": ["5993674eb33f2a43dc4254e9"]
}
   *
   *
   * @apiSuccessExample {json} Success-Response:
   *
   * {
    "_id": "59937c97b87b4503805804cb",
    "name": "sample 001",
    "description": "first sample",
    "userId": "5940442869431c24a06da157",
    "containerId": null,
    "bioDesignId": "5991f31409380a0f58ed92d9",
    "parameterIds": [
        "59936768b33f2a43dc4254ea"
    ],
    "parentSampleIds": [
        "5993674eb33f2a43dc4254e9"
    ]
}

   @apiErrorExample {json} Error-Response - Name argument omitted:
   {
       "statusCode": 400,
       "error": "Bad Request",
       "message": "child \"name\" fails because [\"name\" is required]",
       "validation": {
           "source": "payload",
           "keys": [
               "name"
           ]
       }
   }

   @apiErrorExample {json} Error-Response BioDesignId argument omitted:

   {
     "statusCode": 400,
     "error": "Bad Request",
     "message": "child \"bioDesignId\" fails because [\"bioDesignId\" is required]",
     "validation": {
         "source": "payload",
         "keys": [
             "bioDesignId"
         ]
     }
 }

   */

  server.route({
    method: 'PUT',
    path: '/sample/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: Sample.payload
      }
    },
    handler: function (request, reply) {


      const id = request.params.id;
      const update = {
        $set: {
          name: request.payload.name,
          description: request.payload.description,
          bioDesignId: request.payload.bioDesignId,
          parameterIds: request.payload.parameterIds,
          containerId: request.payload.containerId,
          parentSampleIds: request.payload.parentSampleIds
        }
      };

      Sample.findByIdAndUpdate(id, update, (err, sample) => {

        if (err) {
          return reply(err);
        }

        if (!sample) {
          return reply(Boom.notFound('Sample not found.'));
        }

        reply(sample);
      });
    }
  });


  /**
   * @api {delete} /api/sample/:id Delete Sample By Id
   * @apiName Delete Sample By Id
   * @apiDescription Delete Sample by ID
   * @apiGroup Sample
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} id Sample unique ID.
   * @apiParamExample {string} Example-Request:
   * 59936768b33f2a43dc4254ed
   *
   * @apiSuccessExample {json} Success-Response:
   * {
    "message": "Success."
}

   @apiErrorExample {json} Error-Response Incorrect id:
   {
    "statusCode": 404,
    "error": "Not Found",
    "message": "Document not found."
}
   */

  server.route({
    method: 'DELETE',
    path: '/sample/{id}',
    config: {
      auth: {
        strategy: 'simple',
      },
      pre: [{
        assign: 'sample',
        method: function (request, reply) {

          Sample.findOne({_id: ObjectID(request.params.id)}, (err, sample) => {

            if (err) {
              return reply(err);
            }

            if (!sample) {
              return reply(Boom.notFound('Sample not found.'));
            }

            reply(sample);
          });
        }
      }]
    },
    handler: function (request, reply) {

      Async.auto({
        sample: function (callback) {

          Sample.findOne({_id: ObjectID(request.params.id)}, callback);
        },
        parameters: ['sample', function (results, callback) {

          if (results.sample.parameterIds) {
            var ids = results.sample.parameterIds.map(function (id) {

              return ObjectID(id);
            });
            Parameter.find({_id: {$in: ids}}, callback);
          } else {
            callback(null, []);
          }
        }],
        deleteParameters: ['parameters', function (results, callback) {

          Async.each(results.parameters, function (parameter, callback) {

            Parameter.delete(parameter, callback);
          }, (err) => {

            if (err) {
              callback(err);
            }
            callback(null, null);
          });
        }],
        deleteSample: ['parameters', function (results, callback) {

          Sample.delete(results.sample, callback);
        }]
      }, (err, results) => {

        if (err) {
          reply(err);
        }
        reply({message: 'success'});
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
  name: 'sample'
};
