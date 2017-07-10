'use strict';
const Composer = require('./index');
const Insert = require('./server/standardData/insert');

Composer((err, server) => {

  if (err) {
    throw err;
  }

  Insert.data();

  server.start(() => {

    console.warn('Started the plot device on port ' + server.info.port);
  });
});
