'use strict';
const Async = require('async');
const Bcrypt = require('bcrypt');
const Boom = require('boom');
const Config = require('../../config');
const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {

  const AuthAttempt = server.plugins['hapi-mongo-models'].AuthAttempt;
  const Session = server.plugins['hapi-mongo-models'].Session;
  const User = server.plugins['hapi-mongo-models'].User;

  /**
   * @api {post} /api/login Login
   * @apiName Login
   * @apiDescription Create a new user session
   * @apiGroup Authentication
   * @apiVersion 4.0.0
   * @apiPermission none
   *
   * @apiParam {String} username  user's username or email address.
   * @apiParam {String} password  user's password.
   * @apiParam {String} application  current application name using the api.
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "username":"clotho",
   *    "password":"clotho",
   *    "application":"Clotho Web"
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *  "user": {
   *    "_id": "59416fb93b81ca1e4a0c2523",
   *    "username": "clotho",
   *    "email": "clotho@clotho.com",
   *    "roles": {
   *      "account": {
   *        "id": "59416fb93b81ca1e4a0c2524",
   *        "name": "Clotho User"
   *      }
   *    }
   *  },
   *  "session": {
   *    "userId": "59416fb93b81ca1e4a0c2523",
   *    "application": "Clotho Web",
   *    "key": "3913aaca-7c04-4658-9fb3-9d56b8141868",
   *    "time": "2017-06-14T18:21:19.067Z",
   *    "_id": "59417e9f25f30328c959078a"
   *  },
   *  "authHeader": "Basic NTk0MTdlOWYyNWYzMDMyOGM5NTkwNzhhOjM5MTNhYWNhLTdjMDQtNDY1OC05ZmIzLTlkNTZiODE0MTg2OA=="
   * }
   *
   * @apiErrorExample {json} Error-Response 1:
   * {
   *  "statusCode": 400,
   *  "error": "Bad Request",
   *  "message": "Username and password combination not found or account is inactive."
   * }
   *
   * * @apiErrorExample {json} Error-Response 2:
   * {
   *  "statusCode": 400,
   *  "error": "Bad Request",
   *  "message": "Maximum number of auth attempts reached. Please try again later."
   * }
   */
  server.route({
    method: 'POST',
    path: '/login',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      validate: {
        payload: {
          username: Joi.string().lowercase().required(),
          password: Joi.string().required(),
          application: Joi.string().required()
        }
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      pre: [{
        assign: 'abuseDetected',
        method: function (request, reply) {

          const ip = request.info.remoteAddress;
          const username = request.payload.username;

          AuthAttempt.abuseDetected(ip, username, (err, detected) => {

            if (err) {
              return reply(err);
            }

            if (detected) {
              return reply(Boom.badRequest('Maximum number of auth attempts reached. Please try again later.'));
            }

            reply();
          });
        }
      }, {
        assign: 'user',
        method: function (request, reply) {

          const username = request.payload.username;
          const password = request.payload.password;

          User.findByCredentials(username, password, (err, user) => {

            if (err) {
              return reply(err);
            }

            reply(user);
          });
        }
      }, {
        assign: 'logAttempt',
        method: function (request, reply) {

          if (request.pre.user) {
            return reply();
          }

          const ip = request.info.remoteAddress;
          const username = request.payload.username;

          AuthAttempt.create(ip, username, (err, authAttempt) => {

            if (err) {
              return reply(err);
            }

            return reply(Boom.badRequest('Username and password combination not found or account is inactive.'));
          });
        }
      }, {
        assign: 'session',
        method: function (request, reply) {

          Session.create(request.pre.user._id.toString(), request.payload.application, (err, session) => {

            if (err) {
              return reply(err);
            }

            request.cookieAuth.set(session);
            return reply(session);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const credentials = request.pre.session._id.toString() + ':' + request.pre.session.key;
      const authHeader = 'Basic ' + new Buffer(credentials).toString('base64');

      reply({
        user: {
          _id: request.pre.user._id,
          username: request.pre.user.username,
          email: request.pre.user.email,
          roles: request.pre.user.roles
        },
        session: request.pre.session,
        authHeader
      });
    }
  });

  /**
   * @api {post} /api/login/forgot Forgot Password
   * @apiName Forgot Password
   * @apiDescription Send email to user who forgot password
   * @apiGroup Authentication
   * @apiVersion 4.0.0
   * @apiPermission none
   *
   * @apiParam {String} email  user's email address.
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "email":"clotho@clotho.com"
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *  "message": "success"
   * }
   *
   * @apiErrorExample {json} Error-Response 1:
   * {
   *  "statusCode": 404,
   *  "error": "Not Found",
   *  "message": "There is no user with that email address"
   * }
   *
   * @apiErrorExample {json} Email SMTP not properly configured:
   * {
   *  "statusCode": 500,
   *  "error": "Internal Server Error",
   *  "message": "An internal server error occurred"
   * }
   */
  server.route({
    method: 'POST',
    path: '/login/forgot',
    config: {
      validate: {
        payload: {
          email: Joi.string().email().lowercase().required()
        }
      },
      pre: [{
        assign: 'user',
        method: function (request, reply) {

          const conditions = {
            email: request.payload.email
          };

          User.findOne(conditions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (!user) {
              return reply(Boom.notFound('There is no user with that email address'));
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      const mailer = request.server.plugins.mailer;

      Async.auto({
        keyHash: function (done) {

          Session.generateKeyHash(done);
        },
        user: ['keyHash', function (results, done) {

          const id = request.pre.user._id.toString();
          const update = {
            $set: {
              resetPassword: {
                token: results.keyHash.hash,
                expires: Date.now() + 10000000
              }
            }
          };

          User.findByIdAndUpdate(id, update, done);
        }],
        email: ['user', function (results, done) {

          const emailOptions = {
            subject: 'Reset your ' + Config.get('/projectName') + ' password',
            to: request.payload.email
          };
          const template = 'forgot-password';
          const context = {
            key: results.keyHash.key,
            url: request.headers.origin + '/reset#' + results.keyHash.key
          };

          mailer.sendEmail(emailOptions, template, context, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply({message: 'Success.'});
      });
    }
  });

  /**
   * @api {post} /api/login/reset Reset Password
   * @apiName Reset Password
   * @apiDescription Send email to user who forgot password
   * @apiGroup Authentication
   * @apiVersion 4.0.0
   * @apiPermission none
   *
   * @apiParam {String} key  reset key given by reset email.
   * @apiParam {String} email  user's email address.
   * @apiParam {String} password  user's new password.
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "key":"9f753360-42bf-4203-bdfa-25e132c3225c",
   *    "email":"clotho@clotho.com",
   *    "password": "password"
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *  "message": "success"
   * }
   *
   * @apiErrorExample {json} Error-Response 1:
   * {
   *  "statusCode": 400,
   *  "error": "Bad Request",
   *  "message": "Invalid email or key."
   * }
   */
  server.route({
    method: 'POST',
    path: '/login/reset',
    config: {
      validate: {
        payload: {
          key: Joi.string().required(),
          email: Joi.string().email().lowercase().required(),
          password: Joi.string().required()
        }
      },
      pre: [{
        assign: 'user',
        method: function (request, reply) {

          const conditions = {
            email: request.payload.email,
            'resetPassword.expires': {$gt: Date.now()}
          };

          User.findOne(conditions, (err, user) => {

            if (err) {
              return reply(err);
            }

            if (!user) {
              return reply(Boom.badRequest('Invalid email or key.'));
            }

            reply(user);
          });
        }
      }]
    },
    handler: function (request, reply) {

      Async.auto({
        keyMatch: function (done) {

          const key = request.payload.key;
          const token = request.pre.user.resetPassword.token;
          Bcrypt.compare(key, token, done);
        },
        passwordHash: ['keyMatch', function (results, done) {

          if (!results.keyMatch) {
            return reply(Boom.badRequest('Invalid email or key.'));
          }

          User.generatePasswordHash(request.payload.password, done);
        }],
        user: ['passwordHash', function (results, done) {

          const id = request.pre.user._id.toString();
          const update = {
            $set: {
              password: results.passwordHash.hash
            },
            $unset: {
              resetPassword: undefined
            }
          };

          User.findByIdAndUpdate(id, update, done);
        }],
        removeAuthAttempts: ['user', function (results,done) {

          const ip = request.info.remoteAddress;
          const username = results.user.username;
          AuthAttempt.deleteAuthAttempts(ip, username, done);
        }],
      }, (err, results) => {

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

  server.dependency(['mailer', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'login'
};
