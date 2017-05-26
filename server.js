'use strict';
const Composer = require('./index');


Composer((err, server) => {

  if (err) {
    throw err;
  }

  server.start(() => {

    console.warn('Started the plot device on port ' + server.info.port);
  });
});
