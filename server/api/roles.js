'use strict';

const Boom = require('boom');
const Joi = require('joi');


const internals = {};

internals.applyRoutes = function (server, next) {

  const Role = server.plugins['hapi-mongo-models'].Role;

  /**
   * @api {get} /api/role Get Roles
   * @apiName  Get Roles
   * @apiDescription Get all vaild roles
   * @apiGroup Roles
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} [sort="_id"] Order By
   * @apiParam {Number} [limit=20] Limit
   * @apiParam {Number} [page=1] Page Number
   * @apiParamExample {String} Example Request:
   * /api/role
   *
   * @apiParamExample {String} Example Request:
   * /api/role?limit=2&sort=name&page=2
   *
   * @apiSuccessExample {json} Success-Response:
   * {
    "data": [
        {
            "_id": "59847693b904d00eb0d95aca",
            "name": "BARCODE",
            "type": [
                "MODULE",
                "FEATURE"
            ],
            "userId": "000000000000000000000000"
        },
        {
            "_id": "59847693b904d00eb0d95acb",
            "name": "CDS",
            "type": [
                "MODULE",
                "FEATURE"
            ],
            "userId": "000000000000000000000000"
        },
    ],
    "pages": {
        "current": 1,
        "prev": 0,
        "hasPrev": false,
        "next": 2,
        "hasNext": false,
        "total": 1
    },
    "items": {
        "limit": 20,
        "begin": 1,
        "end": 16,
        "total": 16
    }
}

   * @apiSuccessExample {json} Success-Response:
   * {
    "data": [
        {
            "_id": "59847693b904d00eb0d95acc",
            "name": "DEGRADATION_TAG",
            "type": [
                "MODULE",
                "FEATURE"
            ],
            "userId": "000000000000000000000000"
        },
        {
            "_id": "59847693b904d00eb0d95ad8",
            "name": "FP",
            "type": [
                "MODULE",
                "FEATURE"
            ],
            "userId": "000000000000000000000000"
        }
    ],
    "pages": {
        "current": 2,
        "prev": 1,
        "hasPrev": true,
        "next": 3,
        "hasNext": true,
        "total": 8
    },
    "items": {
        "limit": 2,
        "begin": 3,
        "end": 4,
        "total": 16
    }
}
   *
   */

  server.route({
    method: 'GET',
    path: '/role',
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

      Role.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });

  /**
   * @api {get} /api/role/:id Get Role by Id
   * @apiName  Get Role by Id
   * @apiDescription Get Role by Id
   * @apiGroup Roles
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} id Role unique ID.
   * @apiParamExample {String} id:
   * 59847693b904d00eb0d95acc
   *
   * @apiSuccessExample {json} Success-Response:
   * {
    "_id": "59847693b904d00eb0d95acc",
    "name": "DEGRADATION_TAG",
    "type": [
        "MODULE",
        "FEATURE"
    ],
    "userId": "000000000000000000000000"
}
   *
   */
  server.route({
    method: 'GET',
    path: '/role/{id}',
    config: {
      auth: {
        strategy: 'simple'
      }
    },
    handler: function (request, reply) {

      Role.findById(request.params.id, (err, role) => {

        if (err) {
          return reply(err);
        }

        if (!role) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(role);
      });
    }
  });

  /**
   * @api {post} /api/role/ Create Role
   * @apiName  Create Role
   * @apiDescription Create Role
   * @apiGroup Roles
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} name Role Name
   * @apiParam {Array} type=MODULE,FEATURE Role can be applied to a module and or feature
   * @apiParamExample {JSON} Example-Request:
   * {
	"name": "myRole"
   }
   *
   * @apiSuccessExample {json} Success-Response:
   * {
    "name": "MYROLE",
    "userId": "598389688d5c4635fe2e4417",
    "type": [
        "MODULE",
        "FEATURE"
    ],
    "_id": "598b69b5c8404e3dd23bf2d4"
}
   *
   */
  server.route({
    method: 'POST',
    path: '/role',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().uppercase().required(),
          type: Joi.array().items(Joi.string().valid('MODULE', 'FEATURE')).default(['MODULE', 'FEATURE'])
        }
      }
    },
    handler: function (request, reply) {

      Role.create(
        request.payload.name,
        request.auth.credentials.user._id.toString(),
        request.payload.type,
        (err, role) => {

          if (err) {
            if (err.message === 'Role already exists.') {
              return reply(Boom.badRequest('Role already exists.'));
            } else {
              return reply(err);
            }
          }
          return reply(role);
        });
    }
  });

  /**
   * @api {put} /api/role/:id Update Role By Id
   * @apiName  Update Role By Id
   * @apiDescription Update Role By Id, Does not find instances of role name and updates module and feature.
   * @apiGroup Roles
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} id Role unique ID.
   * @apiParam {String} name Role Name
   * @apiParam {Array} type=MODULE,FEATURE Role can be applied to a module and or feature
   * @apiParamExample {JSON} Example-Request:
   * {
	"name": "myNewRole"
}
   *
   * @apiSuccessExample {json} Success-Response:
   * {
    "_id": "598b69b5c8404e3dd23bf2d4",
    "name": "MYNEWROLE",
    "userId": "598389688d5c4635fe2e4417",
    "type": [
        "MODULE",
        "FEATURE"
    ]
}
   *
   */
  server.route({
    method: 'PUT',
    path: '/role/{id}',
    config: {
      auth: {
        strategy: 'simple'
      },
      pre: [{
        assign: 'checkrole',
        method: function (request, reply) {

          const role = request.payload.name;
          const id = request.params.id;

          // Want to ensure new name doesn't duplicate existing role.
          Role.find({name: role}, (err, results) => {

            if (err) {
              return reply(Boom.badRequest(err));
            }

            if (results.length === 0) {
              reply(true);
            }
            else if (results.length > 0) {
              for (var i = 0; i < results.length; ++i) {
                if (results[i]._id.toString() !== id) {
                  return reply(Boom.badRequest('Role already exists.'));
                }
              }
              reply(true);
            }

          });

        }
      }],
      validate: {
        payload: {
          name: Joi.string().uppercase().required(),
          type: Joi.array().items(Joi.string().valid('MODULE', 'FEATURE')).default(['MODULE', 'FEATURE'])
        }
      }
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          name: request.payload.name.toUpperCase(),
          type: request.payload.type
        }
      };


      Role.findByIdAndUpdate(id, update, (err, role) => {

        if (err) {
          return reply(err);
        }

        if (!role) {
          return reply(Boom.notFound('Role not found.'));
        }

        reply(role);
      });
    }

  });

  /**
   * @api {delete} /api/role/:id Delete Role by Id
   * @apiName  Delete Role by Id
   * @apiDescription Remove Role from database
   * @apiGroup Roles
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} id Role unique ID.
   * @apiParamExample {String} id:
   * 59847693b904d00eb0d95acc
   *
   * @apiSuccessExample {json} Success-Response:
   * {"message": "Success."}
   *
   */

  server.route({
    method: 'DELETE',
    path: '/role/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Role.findByIdAndDelete(request.params.id, (err, role) => {

        if (err) {
          return reply(err);
        }

        if (!role) {
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
  name: 'role'
};
