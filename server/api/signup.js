'use strict';
const Async = require('async');
const Boom = require('boom');
const Config = require('../../config');
const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {

  const Account = server.plugins['hapi-mongo-models'].Account;
  const Session = server.plugins['hapi-mongo-models'].Session;
  const User = server.plugins['hapi-mongo-models'].User;


  server.route({
    method: 'POST',
    path: '/signup',
    config: {
      validate: {
        payload: {
          name: Joi.string().required(),
          email: Joi.string().email().lowercase().required(),
          username: Joi.string().token().lowercase().required(),
          password: Joi.string().required()
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

          Account.findByIdAndUpdate(id, update, done);
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

          User.findByIdAndUpdate(id, update, done);
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

          Session.create(results.user._id.toString(), done);
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
        request.cookieAuth.set(result);
        reply(result);
      });
    }
  });

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

  server.dependency(['mailer', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'signup'
};
