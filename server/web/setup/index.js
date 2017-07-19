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

      MongoClient.connect(url, function (err, db) { // Connect to the db
        if (err) throw err;

        var collection = db.collection('users');  // Define the users collection
        collection.findOne({username: 'root'}, {}, function (err, doc) {  // Query users colection for root user
          if (doc) {  // If root user exists
            // Let them change settings
            return reply.view('setup', {title: 'Setup'});
          }
          // If root user does not exist
          // Create root user
          return reply.view('setup', {user: {rootUsername: 'root', rootName: 'root'}, title: 'Please create a root user account.'});

          db.close();
        });
      });
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
