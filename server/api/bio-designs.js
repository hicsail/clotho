'use strict';

const Boom = require('boom');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const BioDesign = server.plugins['hapi-mongo-models'].BioDesign;

  server.route({
    method: 'GET',
    path: '/bio-design',
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

  /**
   * @api {get} /api/bio-design/:id Get BioDesign By Id
   * @apiName Get BioDesign By Id
   * @apiDescription Get BioDesign by ID
   * @apiGroup BioDesign
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} id BioDesign unique ID.
   * @apiParamExample {string} Example-Request:
   * 5992346bab9a6349c82e0d2a
   *
   * @apiSuccessExample {json} Success-Response:
   * {
    "_id": "5992346bab9a6349c82e0d2a",
    "name": "BBa_0124",
    "description": "Operon for lactose metabolism",
    "userId": "5940442869431c24a06da157",
    "displayId": "Lac operon",
    "imageURL": "example.png",
    "subBioDesignIds": [
        "5991f34209380a0f58ed92dd",
        "5991f31409380a0f58ed92d4"
    ],
    "superBioDesignId": null,
    "type": "DEVICE"
}

   @apiErrorExample {json} Error-Response
   {
    "statusCode": 404,
    "error": "Not Found",
    "message": "Document not found."
}
   */

  server.route({
    method: 'GET',
    path: '/bio-design/{id}',
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

  /**
   * @api {post} /api/bio-design/ Create BioDesign
   * @apiName Create BioDesign
   * @apiDescription Create BioDesign
   * @apiGroup BioDesign
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {string} name BioDesign name
   * @apiParam {string} [description] BioDesign description
   * @apiParam {string} [displayId] BioDesign displayId.
   * @apiParam {string} [imageURL] BioDesign url
   * @apiParam {object} [subBioDesignIds] Array of strings with ids of subBioDesigns.
   * @apiParam {string} [superBioDesignId] Id of superBioDesign (e.g. as would occur in a Convenience Device).
   * @apiParam {string} [type] Uppercase string representing design type.
   * @apiParam {string} [application] Application
   *
   * @apiParamExample {json} Example-Request:
   *
   * {
	"name": "BBa_0124",
	"description": "Operon for lactose metabolism",
	"displayId": "Lac operon",
	"imageURL": "example.png",
	"subBioDesignIds": ["5991f34209380a0f58ed92dd", "5991f31409380a0f58ed92d4"],
	"type": "DEVICE",
	"application": "clotho"
}
   *
   *
   * @apiSuccessExample {json} Success-Response:
   *
   * {
    "name": "BBa_0124",
    "description": "Operon for lactose metabolism",
    "userId": "5940442869431c24a06da157",
    "displayId": "Lac operon",
    "imageURL": "example.png",
    "subBioDesignIds": [
        "5991f34209380a0f58ed92dd",
        "5991f31409380a0f58ed92d4"
    ],
    "type": "DEVICE",
    "_id": "5992346bab9a6349c82e0d2a"
}

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
   */


  server.route({
    method: 'POST',
    path: '/bio-design',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          displayId: Joi.string().optional(),
          imageURL: Joi.string().optional(),
          subBioDesignIds: Joi.array().items(Joi.string()).optional(),
          superBioDesignId: Joi.string().optional(),
          type: Joi.string().uppercase().optional(),
          application: Joi.string().optional()
        }
      }
    },

    handler: function (request, reply) {

      BioDesign.create(
        request.payload.name,
        request.payload.description,
        request.auth.credentials.user._id.toString(),
        request.payload.displayId,
        request.payload.imageURL,
        request.payload.subBioDesignIds,
        request.payload.superBioDesignId,
        request.payload.type,
        request.payload.application,
        (err, bioDesign) => {

          if (err) {
            return reply(err);
          }
          return reply(bioDesign);
        });
    }
  });


  /**
   * @api {put} /api/bio-design/:id Update BioDesign
   * @apiName Update BioDesign
   * @apiDescription Update BioDesign By Id
   * @apiGroup BioDesign
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {string} name BioDesign name
   * @apiParam {string} [description] BioDesign description
   * @apiParam {string} [displayId] BioDesign displayId.
   * @apiParam {string} [imageURL] BioDesign url
   * @apiParam {object} [subBioDesignIds] Array of strings with ids of subBioDesigns.
   * @apiParam {string} [superBioDesignId] Id of superBioDesign (e.g. as would occur in a Convenience Device).
   *
   * @apiParamExample {json} Example-Request:
   *
   * {{
	"name": "BBa_0124",
	"description": "Lac Op",
	"displayId": "LacABC",
	"imageURL": "example2.png",
	"subBioDesignIds": ["5991f34209380a0f58ed92dd", "5991f31409380a0f58ed92d4"]
}
   *
   *
   * @apiSuccessExample {json} Success-Response:
   *{
    "_id": "5992346bab9a6349c82e0d2a",
    "name": "BBa_0124",
    "description": "Lac Op",
    "userId": "5940442869431c24a06da157",
    "displayId": "LacABC",
    "imageURL": "example2.png",
    "subBioDesignIds": [
        "5991f34209380a0f58ed92dd",
        "5991f31409380a0f58ed92d4"
    ],
    "superBioDesignId": null,
    "type": "DEVICE"
}

   @apiErrorExample {json} Error-Response:
   {
       "statusCode": 404,
       "error": "Not Found",
       "message": "Bio Design not found."
   }
   */


  server.route({
    method: 'PUT',
    path: '/bio-design/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          displayId: Joi.string().optional(),
          imageURL: Joi.string().optional(),
          subBioDesignIds: Joi.array().items(Joi.string()).optional(),
          superBioDesignId: Joi.string().optional()
        }
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          name: request.payload.name,
          description: request.payload.description,
          displayId: request.payload.displayId,
          imageURL: request.payload.imageURL,
          subBioDesignIds: request.payload.subBioDesignIds,
          superBioDesignId: request.payload.superBioDesignId
        }
      };

      BioDesign.findByIdAndUpdate(id, update, (err, bio_design) => {

        if (err) {
          return reply(err);
        }

        if (!bio_design) {
          return reply(Boom.notFound('Bio Design not found.'));
        }

        return reply(bio_design);
      });
    }
  });


  /**
   * @api {delete} /api/bio-design/:id Get BioDesign By Id
   * @apiName Delete BioDesign By Id
   * @apiDescription Delete BioDesign by ID
   * @apiGroup BioDesign
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} id BioDesign unique ID.
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
    path: '/bio-design/{id}',
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
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'bio-design'
};
