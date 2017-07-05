'use strict';
const Async = require('async');
const Boom = require('boom');
const Config = require('../../config');
const Joi = require('joi');
const ObjectID = require('mongo-models').ObjectID;

const internals = {};


internals.applyRoutes = function (server, next) {

  const Account = server.plugins['hapi-mongo-models'].Account;
  const Session = server.plugins['hapi-mongo-models'].Session;
  const User = server.plugins['hapi-mongo-models'].User;

  /**
   * @api {post} /api/signup Signup
   * @apiName Signup
   * @apiDescription Create a new user account
   * @apiGroup Authentication
   * @apiVersion 4.0.0
   * @apiPermission none
   *
   * @apiParam {String} username  user's username or email address.
   * @apiParam {String} password  user's password.
   * @apiParam {String} email     user's email.
   * @apiParam {String} name      user's full name.
   * @apiParam {String} application  current application name using the api.
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "username":"clotho",
   *    "password":"clotho",
   *    "email":"clotho@clotho.com",
   *    "name": "Clotho User",
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
   *  "statusCode": 409,
   *  "error": "Conflict",
   *  "message": "Username already in use."
   * }
   *
   * * @apiErrorExample {json} Error-Response 2:
   * {
   *  "statusCode": 409,
   *  "error": "Conflict",
   *  "message": "Email already in use."
   * }
   */
  server.route({
    method: 'POST',
    path: '/signup',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          email: Joi.string().email().lowercase().required(),
          username: Joi.string().token().lowercase().required(),
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
      }]
    },
    handler: function (request, reply) {

      const mailer = request.server.plugins.mailer;

      Async.auto({
        user: function (done) {

          const username = request.payload.username;
          const password = request.payload.password;
          const email = request.payload.email;
          const name = request.payload.name;

          User.create(username, password, email, name, done);
        },
        account: ['user', function (results, done) {

          const name = request.payload.name;

          Account.create(name, done);
        }],
        linkUser: ['account', function (results, done) {

          const id = results.account._id.toString();
          const update = {
            $set: {
              user: {
                id: results.user._id.toString(),
                name: results.user.username
              }
            }
          };

          Account.findOneAndUpdate({_id: ObjectID(id), $isolated: 1}, update, done);
        }],
        linkAccount: ['account', function (results, done) {

          const id = results.user._id.toString();
          const update = {
            $set: {
              roles: {
                account: {
                  id: results.account._id.toString(),
                  name: results.account.name.first + ' ' + results.account.name.last
                }
              }
            }
          };

          User.findOneAndUpdate({_id: ObjectID(id), $isolated: 1}, update, done);
        }],
        welcome: ['linkUser', 'linkAccount', function (results, done) {

          const emailOptions = {
            subject: 'Your ' + Config.get('/projectName') + ' account',
            to: {
              name: request.payload.name,
              address: request.payload.email
            }
          };
          const template = 'welcome';

          mailer.sendEmail(emailOptions, template, request.payload, (err) => {

            if (err) {
              console.warn('sending welcome email failed:', err.stack);
            }
          });

          done();
        }],
        session: ['linkUser', 'linkAccount', function (results, done) {

          Session.create(results.user._id.toString(), request.payload.application, done);
        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        const user = results.linkAccount;
        const credentials = results.session._id + ':' + results.session.key;
        const authHeader = 'Basic ' + new Buffer(credentials).toString('base64');

        const result = {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            roles: user.roles
          },
          session: results.session,
          authHeader
        };

        request.cookieAuth.set(results.session);
        reply(result);
      });
    }
  });

  /**
   * @api {post} /api/available Available
   * @apiName Available
   * @apiDescription Check is username and email is available
   * @apiGroup Authentication
   * @apiVersion 4.0.0
   * @apiPermission none
   *
   * @apiParam {String} username  user's username or email address.
   * @apiParam {String} email     user's email.
   *
   * @apiParamExample {json} Request-Example 1:
   *  {
   *    "username":"ClothoUser",
   *    "email":"clotho@clotho-bu.com"
   *  }
   *
   * @apiParamExample {json} Request-Example 2:
   *  {
   *    "username":"Clotho",
   *    "email":"clotho@clotho.com"
   *  }
   *
   * @apiParamExample {json} Request-Example 2:
   *  {
   *    "username":"clothoUser"
   *  }
   *
   * @apiParamExample {json} Request-Example 4:
   *  {
   *    "email":"clotho@clotho.com"
   *  }
   *
   * @apiSuccessExample {json} Success-Response 1:
   * {
   *  "username": {
   *      "status": "available",
   *      "message": "This username is available"
   *   },
   *   "email": {
   *      "status": "available",
   *      "message": "This email is available"
   *    }
   * }
   *
   * @apiSuccessExample {json} Success-Response 2:
   * {
   *  "username": {
   *      "status": "taken",
   *      "message": "This username is not available"
   *   },
   *   "email": {
   *      "status": "taken",
   *      "message": "This email is not available"
   *    }
   * }
   *
   * @apiSuccessExample {json} Success-Response 3:
   * {
   *  "username": {
   *      "status": "available",
   *      "message": "This username is available"
   *   }
   * }
   *
   * @apiSuccessExample {json} Success-Response 4:
   * {
   *   "email": {
   *      "status": "taken",
   *      "message": "This email is not available"
   *    }
   * }
   *
   */
  server.route({
    method: 'POST',
    path: '/available',
    config: {
      validate: {
        payload: {
          email: Joi.string().email().lowercase().optional(),
          username: Joi.string().token().lowercase().optional(),
        }
      },
      pre: [{
        assign: 'vaildInput',
        method: function (request, reply) {

          const username = request.payload.username;
          const email = request.payload.email;

          if(!username && !email) {
            return reply(Boom.badRequest('invaild submission, submit username and/or email'));
          }
          reply(true);
        }
      }]
    },
    handler: function (request, reply) {

      const username = request.payload.username;
      const email = request.payload.email;

      Async.auto({
        username: function (done) {

          const username = request.payload.username;


          User.findOne({username: username}, done);
        },
        email: function (done) {

          const email = request.payload.email;

          User.findOne({email: email}, done);
        }
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        var available = {};

        if(username) {
          if(results.username) {
            available.username = {
              status: 'taken',
              message: 'This username is not available'
            };
          } else {
            available.username = {
              status: 'available',
              message: 'This username is available'
            };
          }
        }
        if(email) {
          if(results.email) {
            available.email = {
              status: 'taken',
              message: 'This email is already registered'
            };
          } else {
            available.email = {
              status: 'available',
              message: 'This email is available'
            };
          }
        }

        reply(available);
      });
    }
  });
  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth','mailer', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'signup'
};
