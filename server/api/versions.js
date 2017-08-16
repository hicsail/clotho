'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const Version = server.plugins['hapi-mongo-models'].Version;

  server.route({
    method: 'GET',
    path: '/version',
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

      Version.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });


  /**
   * @api {get} /api/version/:id Get Version By Id
   * @apiName Get Version By Id
   * @apiDescription Get Version by ID
   * @apiGroup Version
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} id Version unique ID.
   * @apiParamExample {json} Example-Request:
   *5993917fa68bb40358c6a6d6
   *
   * @apiSuccessExample {json} Success-Response:
   * {
    "_id": "5993917fa68bb40358c6a6d6",
    "userId": "5940442869431c24a06da157",
    "objectId": "59936768b33f2a43dc4254ea",
    "versionNumber": 1.01,
    "collectionName": "parameters",
    "description": "sodium parameter v1.01",
    "application": "clotho",
    "time": "2017-08-16T00:41:44.782Z",
    "replacementVersionId": "5993674eb33f2a43dc4254e8"
}

   @apiErrorExample {json} Error-Response:
   {
    "statusCode": 404,
    "error": "Not Found",
    "message": "Document not found."
}
   */

  server.route({
    method: 'GET',
    path: '/version/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Version.findById(request.params.id, (err, version) => {

        if (err) {
          return reply(err);
        }

        if (!version) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(version);
      });
    }
  });

  /**
   * @api {post} /api/version Create Version
   * @apiName Create Version
   * @apiDescription Creates a new version
   * @apiGroup Version
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} objectId Id of object being versioned
   * @apiParam {Number} [versionNumber] Version number
   * @apiParam {String} [collectionName] Collection name
   * @apiParam {String} [description] Description
   * @apiParam {String} [application] Name of application
   *
   * @apiParamExample {json} Example-Request:
   *
   * {
	"objectId": "59936768b33f2a43dc4254ea",
	"versionNumber": 1.0,
	"collectionName": "parameters",
	"description": "sodium parameter",
	"application": "clotho"
}
   *
   * @apiSuccessExample {json} Success-Response:
   *
   {
    "userId": "5940442869431c24a06da157",
    "objectId": "59936768b33f2a43dc4254ea",
    "versionNumber": 1,
    "collectionName": "parameters",
    "description": "sodium parameter",
    "application": "clotho",
    "time": "2017-08-16T00:27:43.607Z",
    "_id": "5993917fa68bb40358c6a6d6"
}
   */

  server.route({
    method: 'POST',
    path: '/version',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          objectId: Joi.string().required(),
          versionNumber: Joi.number(),
          collectionName: Joi.string(),
          description: Joi.string().optional(),
          application: Joi.string()
        }
      }
    },

    handler: function (request, reply) {

      Version.create(
        request.auth.credentials.user._id.toString(),
        request.payload.objectId,
        request.payload.versionNumber,
        request.payload.collectionName,
        request.payload.description,
        request.payload.application,
        (err, version) => {

          if (err) {
            return reply(err);
          }
          return reply(version);
        });
    }
  });


  /**
   * @api {put} /api/version/:id Update Version By Id
   * @apiName Update Version By Id
   * @apiDescription Update Version by ID
   * @apiGroup Version
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} userId Id of user updating object
   * @apiParam {String} objectId Id of object being versioned
   * @apiParam {Number} [versionNumber] Version number
   * @apiParam {String} [collectionName] Collection name
   * @apiParam {Date} [time] Time of creation. Default is time of api call.
   * @apiParam {String} [replacementVersionId] Replacement version id (that of newer version)
   * @apiParam {String} [description] Description
   * @apiParam {String} [application] Name of application
   * @apiParamExample {json} Example-Request:
   *
   *{
	"userId": "5940442869431c24a06da157",
	"objectId": "59936768b33f2a43dc4254ea",
	"versionNumber": 1.01,
	"collectionName": "parameters",
	"replacementVersionId": "5993674eb33f2a43dc4254e8",
	"description": "sodium parameter v1.01",
	"application": "clotho"
}
   *
   * @apiSuccessExample {json} Success-Response:
   *
   * {
    "_id": "5993917fa68bb40358c6a6d6",
    "userId": "5940442869431c24a06da157",
    "objectId": "59936768b33f2a43dc4254ea",
    "versionNumber": 1.01,
    "collectionName": "parameters",
    "description": "sodium parameter v1.01",
    "application": "clotho",
    "time": "2017-08-16T00:38:09.700Z",
    "replacementVersionId": "5993674eb33f2a43dc4254e8"
}

   @apiErrorExample {json} Error-Response incorrect id:
   {
    "statusCode": 404,
    "error": "Not Found",
    "message": "Document not found."
}
   *
   */

  server.route({
    method: 'PUT',
    path: '/version/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          userId: Joi.string().required(),
          objectId: Joi.string().required(),
          versionNumber: Joi.number(),
          collectionName: Joi.string(),
          time: Joi.date().default(new Date()),
          replacementVersionId: Joi.string().optional(),
          description: Joi.string().optional(),
          application: Joi.string()
        }
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          userId: request.payload.userId,
          objectId: request.payload.objectId,
          versionNumber: request.payload.versionNumber,
          collectionName: request.payload.collectionName,
          time: request.payload.time,
          replacementVersionId: request.payload.replacementVersionId,
          description: request.payload.description,
          application: request.payload.application
        }
      };

      Version.findByIdAndUpdate(id, update, (err, version) => {

        if (err) {
          return reply(err);
        }

        if (!version) {
          return reply(Boom.notFound('Version not found.'));
        }

        reply(version);
      });
    }
  });



  /**
   * @api {delete} /api/version/:id Delete Version By Id
   * @apiName Delete Version By Id
   * @apiDescription Delete Version by ID
   * @apiGroup Version
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} id Version unique ID.
   * @apiParamExample {string} Example-Request:
   * 5988a74da16d369e56953cf3
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
    path: '/version/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Version.findByIdAndDelete(request.params.id, (err, version) => {

        if (err) {
          return reply(err);
        }

        if (!version) {
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
  name: 'version'
};
