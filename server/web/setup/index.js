'use strict';
const internals = {};
// const users = require('../../models/user');
const MongoClient = require('mongodb').MongoClient;
const Joi = require('joi');
const ObjectId = require('mongo-models').ObjectId;
const Async = require('async');

internals.applyRoutes = function (server, next) {


  server.route({
    method: 'GET',
    path: '/setup',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    },
    handler: function (request, reply) {
      var url = 'mongodb://localhost:27017/clotho';

      MongoClient.connect(url, function (err, db) { // Connect to the db
        if (err) throw err;

        var collection = db.collection('users');  // Define the users collection
        collection.findOne({username: 'root'}, {}, function (err, doc) {  // Query users colection for root user
          if (doc) {  // If root user exists
            // Let them change settings
            return reply.view('setup', {title: 'Setup Complete!'});
          }
          // If root user does not exist
          // Create root user
          return reply.view('setup', {title: 'Please create a root user account.'});

          db.close();
        });
      });
    }

  });

  const Account = server.plugins['hapi-mongo-models'].Account;
  const Session = server.plugins['hapi-mongo-models'].Session;
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
          password: Joi.string().required()
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
        user: function (done) {
          const email = request.payload.email;
          const password = request.payload.password;

          User.create('root', password, email, 'root', done);
        },
        account: ['user', function (results, done) {

          Account.create('root', done);
        }],
        linkUser: ['account', function (results, done) {

          // const id = results.account._id.toString();
          const update = {
            $set: {
              user: {
                id: results.user._id.toString(),
                name: results.user.username
              }
            }
          };

          // Account.findByIdAndUpdate(id, update, done);
          Account.findOneAndUpdate({name:'root'}, update, done);
        }],
        linkAccount: ['account', function (results, done) {

          // const id = results.user._id.toString();
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

          // User.findByIdAndUpdate(id, update, done);
          User.findOneAndUpdate({name: 'account'}, update, done);
        }],
        update: ['linkUser', 'linkAccount', function (results, done) {

          // const id = results.user.id.toString();
          const update = {
            $set: {
              user: {
                _id: ObjectId('000000000000000000000000')
              }
            }
          };

          // User.findByIdAndUpdate(id, update, done);
          User.findOneAndUpdate({name: 'root'}, update, done);
        }]
      });
      return reply.redirect('/');
    }
  });

  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'setup',
  dependencies: 'visionary'
};
