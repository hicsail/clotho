'use strict';
const internals = {};
// const users = require('../../models/user');
const MongoClient = require('mongodb').MongoClient;

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

      MongoClient.connect(url, function (err, db) {
        if (err) throw err;

        var collection = db.collection('users');  // Define the users collection
        collection.findOne({username: 'root'}, {}, function (err, doc) {  // Query users colection for root user
          if (doc) {  // If root user exists
            // Let them change settings
          } else {
            // Direct to create root user
          }
          db.close();
        });


      });

      return reply.view('setup', {title: 'Setup page'});
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
