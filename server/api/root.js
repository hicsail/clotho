'use strict';
const Async = require('async');
const Boom = require('boom');
const Config = require('../../config');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {

  const User = server.plugins['hapi-mongo-models'].User;

  server.route({
    method: 'POST',
    path: '/setup',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      validate: {
        payload: {
          email: Joi.string().email().lowercase().required(),
          password: password: Joi.string().required()
        }
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
    },
    handler: function (request, reply) {

      Async.auto({
        createUser: function (done) {
          const email = request.payload.email;
          const password = request.payload.password;

          User.create('root', password, email, 'root', done);
        },
        account: ['user', function (results, done) {

          Account.create('root', done);
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
        update: ['linkUser', 'linkAccount', function(results, done) {
          const id = results.user.id.toString();
          const update = {
            $set: {
              user: {
                __id: 0000
              }
            }
          };
          User.findByIdAndUpdate(id,update, done);
        }]
      });

    }
  });
};
