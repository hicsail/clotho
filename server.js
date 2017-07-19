'use strict';
const Composer = require('./index');
const MongoClient = require('mongodb').MongoClient;


Composer((err, server) => {

  if (err) {
    throw err;
  }

  server.start(() => {

    console.warn('Started the plot device on port ' + server.info.port);

    // Instructions to setup root user if there is none.
    var url = 'mongodb://localhost:27017/clotho';

    MongoClient.connect(url, function (err, db) { // Connect to the db
      if (err) throw err;

      var collection = db.collection('users');  // Define the users collection
      collection.findOne({username: 'root'}, {}, function (err, doc) {  // Query users colection for root user
        if (doc === null) {  // If root user exists
          // Let them change settings
          console.log('Please go to the setup page to create a root user.');
        }
      });
    });
  });
});
