'use strict';
const Composer = require('./index');
const Insert = require('./server/standardData/insert');
const User = require('./server/models/user');
Composer((err, server) => {

  if (err) {
    throw err;
  }

  Insert.data();

  server.start(() => {

    console.warn('Started the plot device on port ' + server.info.port);

    Insert.data();

    User.findOne({username:'root'}, (err, user) => {

      if(err) {
        console.error(err);
      }

      if(user === null) {
        console.warn('Please go to /setup to finish installation');
      }
    });
  });
});
