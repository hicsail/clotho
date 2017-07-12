'use strict';
const AuthPlugin = require('../auth');
const Boom = require('boom');
const Joi = require('joi');
const ObjectID = require('mongo-models').ObjectID;

const internals = {};

/**
 * @apiDefine AuthHeader
 * @apiHeader (Authorization) {String} Authorization Basic Authorization value.
 * @apiHeaderExample {String} Authorization Header
 * "Authorization: Basic NTk1NTA1NDliOGQwYjIxNDJlNTRjNDdjOjVjNjg0ZGQyLTkwZmYtNDY0Ni04YjUxLTc2MGVhMzljYWI4YQ=="
 */

internals.applyRoutes = function (server, next) {

  const User = server.plugins['hapi-mongo-models'].User;


  server.route({
    method: 'GET',
    path: '/users',
    config: {
      auth: {
        strategies: ['simple','session'],
        scope: 'admin'
      },
      validate: {
        query: {
          username: Joi.string().token().lowercase(),
          isActive: Joi.string(),
          role: Joi.string(),
          fields: Joi.string(),
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1)
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      const query = {};
      if (request.query.username) {
        query.username = new RegExp('^.*?' + request.query.username + '.*$', 'i');
      }
      if (request.query.isActive) {
        query.isActive = request.query.isActive === 'true';
      }
      if (request.query.role) {
        query['roles.' + request.query.role] = {$exists: true};
      }
      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;

      User.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/users/{id}',
    config: {
      auth: {
        strategies: ['simple','session'],
        scope: 'admin'
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      User.findById(request.params.id, (err, user) => {

        if (err) {
          return reply(err);
        }

        if (!user) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(user);
      });
    }
  });

  /**
   * @api {get} /api/users/my Get Current User
   * @apiName /api/users/my
   * @apiDescription Get current user
   * @apiGroup User
   * @apiVersion 4.0.0
   * @apiPermission user
   * @apiUse AuthHeader
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *    "_id": "59416fb93b81ca1e4a0c2523",
   *    "username": "clotho",
   *    "email": "clotho@clotho.com",
   *    "roles": {
   *      "account": {
   *        "id": "59416fb93b81ca1e4a0c2524",
   *        "name": "Clotho User"
   *      }
   *    }
   * }
   *
   * @apiErrorExample {json} Error-Response :
   * {
   *  "statusCode": 401,
   *  "error": "Unauthorized",
   *  "message": "Missing authentication"
   * }
   *
   */
  server.route({
    method: 'GET',
    path: '/users/my',
    config: {
      auth: {
        strategies: ['simple','session'],
        scope: ['admin', 'account']
      }
    },
    handler: function (request, reply) {

      const id = request.auth.credentials.user._id.toString();
      const fields = User.fieldsAdapter('username name email roles');

      User.findById(id, fields, (err, user) => {

        if (err) {
          return reply(err);
        }

        if (!user) {
          return reply(Boom.notFound('Document not found. That is strange.'));
        }

        reply(user);
      });
    }
  });


  server.route({
    method: 'POST',
    path: '/users',
    config: {
      auth: {
        strategies: ['simple','session'],
        scope: 'admin'
      },
      validate: {
        payload: {
          username: Joi.string().token().lowercase().required(),
          password: Joi.string().required(),
          email: Joi.string().email().lowercase().required(),
          name: Joi.string().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root'),
        {
          assign: 'usernameCheck',
          method: function (request, reply) {

            const conditions = {
              username: request.payload.username
            };

            User.findOne(conditions, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (user) {
                return reply(Boom.conflict('Username already in use.'));
              }

              reply(true);
            });
          }
        }, {
          assign: 'emailCheck',
          method: function (request, reply) {

            const conditions = {
              email: request.payload.email
            };

            User.findOne(conditions, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (user) {
                return reply(Boom.conflict('Email already in use.'));
              }

              reply(true);
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      const username = request.payload.username;
      const password = request.payload.password;
      const email = request.payload.email;
      const name = request.payload.name;

      User.create(username, password, email, name, (err, user) => {

        if (err) {
          return reply(err);
        }

        reply(user);
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/users/{id}',
    config: {
      auth: {
        strategies: ['simple','session'],
        scope: 'admin'
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        },
        payload: {
          isActive: Joi.boolean().required(),
          username: Joi.string().token().lowercase().required(),
          email: Joi.string().email().lowercase().required(),
          name: Joi.string().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root'),
        {
          assign: 'usernameCheck',
          method: function (request, reply) {

            const conditions = {
              username: request.payload.username,
              _id: {$ne: User._idClass(request.params.id)}
            };

            User.findOne(conditions, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (user) {
                return reply(Boom.conflict('Username already in use.'));
              }

              reply(true);
            });
          }
        }, {
          assign: 'emailCheck',
          method: function (request, reply) {

            const conditions = {
              email: request.payload.email,
              _id: {$ne: User._idClass(request.params.id)}
            };

            User.findOne(conditions, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (user) {
                return reply(Boom.conflict('Email already in use.'));
              }

              reply(true);
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          isActive: request.payload.isActive,
          username: request.payload.username,
          email: request.payload.email,
          name: request.payload.name
        }
      };

      User.findOneAndUpdate({_id: ObjectID(id), $isolated: 1}, update, (err, user) => {

        if (err) {
          return reply(err);
        }

        if (!user) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(user);
      });
    }
  });

  /**
   * @api {put} /api/users/my Update Current User
   * @apiName Update Current User
   * @apiDescription Update current user's username, email, or name
   * @apiGroup User
   * @apiVersion 4.0.0
   * @apiPermission user
   * @apiUse AuthHeader
   *
   * @apiParam {String} username  user's new username.
   * @apiParam {String} email     user's new email.
   * @apiParam {String} name      user's new full name.
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "username":"clotho2",
   *    "email":"clotho2@clotho.com",
   *    "name": "Clotho2 User",
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *    "_id": "59416fb93b81ca1e4a0c2523",
   *    "isActive": true,
   *    "username": "clotho2",
   *    "email": "clotho2@clotho.com",
   *    "name": "Clotho2 User",
   *    "timeCreated": "2017-06-14T18:49:01.255Z",
   *    "roles": {
   *      "account": {
   *        "id": "59416fb93b81ca1e4a0c2524",
   *        "name": "Clotho User"
   *      }
   *    }
   * }
   *
   * @apiErrorExample {json} Error-Response :
   * {
   *  "statusCode": 401,
   *  "error": "Unauthorized",
   *  "message": "Missing authentication"
   * }
   *
   */
  server.route({
    method: 'PUT',
    path: '/users/my',
    config: {
      auth: {
        strategies: ['simple','session'],
        scope: ['admin', 'account']
      },
      validate: {
        payload: {
          username: Joi.string().token().lowercase().required(),
          email: Joi.string().email().lowercase().required(),
          name: Joi.string().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureNotRoot,
        {
          assign: 'usernameCheck',
          method: function (request, reply) {

            const conditions = {
              username: request.payload.username,
              _id: {$ne: request.auth.credentials.user._id}
            };

            User.findOne(conditions, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (user) {
                return reply(Boom.conflict('Username already in use.'));
              }

              reply(true);
            });
          }
        }, {
          assign: 'emailCheck',
          method: function (request, reply) {

            const conditions = {
              email: request.payload.email,
              _id: {$ne: request.auth.credentials.user._id}
            };

            User.findOne(conditions, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (user) {
                return reply(Boom.conflict('Email already in use.'));
              }

              reply(true);
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      const id = request.auth.credentials.user._id.toString();
      const update = {
        $set: {
          username: request.payload.username,
          email: request.payload.email,
          name: request.payload.name,
        }
      };
      const findOptions = {
        fields: User.fieldsAdapter('username email name roles')
      };

      User.findOneAndUpdate({_id: ObjectID(id), $isolated: 1}, update, findOptions, (err, user) => {

        if (err) {
          return reply(err);
        }

        reply(user);
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/users/{id}/password',
    config: {
      auth: {
        strategies: ['simple','session'],
        scope: 'admin'
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        },
        payload: {
          password: Joi.string().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root'),
        {
          assign: 'password',
          method: function (request, reply) {

            User.generatePasswordHash(request.payload.password, (err, hash) => {

              if (err) {
                return reply(err);
              }

              reply(hash);
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          password: request.pre.password.hash
        }
      };

      User.findOneAndUpdate({_id: ObjectID(id), $isolated: 1}, update, (err, user) => {

        if (err) {
          return reply(err);
        }

        reply(user);
      });
    }
  });

  /**
   * @api {put} /api/users/my/password Change Password
   * @apiName Change Password
   * @apiDescription Change User's Password
   * @apiGroup User
   * @apiVersion 4.0.0
   * @apiPermission user
   * @apiUse AuthHeader
   *
   * @apiParam {String} password  user's new password.
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "password":"clotho"
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *    "_id": "59416fb93b81ca1e4a0c2523",
   *    "isActive": true,
   *    "username": "clotho",
   *    "password": "$2a$10$T0wK82pi7gzZAqdcEbt38uEBTAB5bhu0mqPYwCAHYwBo7/C0IFjMm",
   *    "email": "clotho@clotho.com",
   *    "name": "Clotho User",
   *    "timeCreated": "2017-06-14T18:49:01.255Z",
   *    "roles": {
   *      "account": {
   *        "id": "59416fb93b81ca1e4a0c2524",
   *        "name": "Clotho User"
   *      }
   *    }
   * }
   *
   * @apiErrorExample {json} Error-Response :
   * {
   *  "statusCode": 401,
   *  "error": "Unauthorized",
   *  "message": "Missing authentication"
   * }
   *
   */
  server.route({
    method: 'PUT',
    path: '/users/my/password',
    config: {
      auth: {
        strategies: ['simple','session'],
        scope: ['admin', 'account']
      },
      validate: {
        payload: {
          password: Joi.string().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureNotRoot,
        {
          assign: 'password',
          method: function (request, reply) {

            User.generatePasswordHash(request.payload.password, (err, hash) => {

              if (err) {
                return reply(err);
              }

              reply(hash);
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      const id = request.auth.credentials.user._id.toString();
      const update = {
        $set: {
          password: request.pre.password.hash
        }
      };
      const findOptions = {
        fields: User.fieldsAdapter('username email')
      };

      User.findOneAndUpdate({_id: ObjectID(id), $isolated: 1}, update, findOptions, (err, user) => {

        if (err) {
          return reply(err);
        }

        reply(user);
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/users/{id}',
    config: {
      auth: {
        strategies: ['simple','session'],
        scope: 'admin'
      },
      validate: {
        params: {
          id: Joi.string().invalid('000000000000000000000000')
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      User.findByIdAndDelete(request.params.id, (err, user) => {

        if (err) {
          return reply(err);
        }

        if (!user) {
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
  name: 'users'
};
