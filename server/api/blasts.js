'use strict';

const Joi = require('joi');
const { spawn } = require('child_process');
const fs = require('fs');

const internals = {};

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'POST',
    path: '/blast',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          sequenceId: Joi.string().required()
        }
      }
    },

    handler: function (request, reply) {
      const mkdir = spawn('mkdir', ['-p', './blast/test1']);

      mkdir.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
      });

      // Create and write to file.
      var fileContent = '> Sequence Name-SequenceID\nTAGDTAGDTdnalettersTSGAGTA';
      fs.writeFile('blast/test1/tesfile.fasta', fileContent, function (err) {

      });

    }
  });
};
