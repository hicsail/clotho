'use strict';

const Joi = require('joi');
const { execFile } = require('child_process');
const fs = require('fs');
const Hapi = require('hapi');

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
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1),
          name: Joi.string(),
          displayId: Joi.string(),
          role: Joi.string().valid('BARCODE', 'CDS', 'DEGRADATION_TAG', 'GENE', 'LOCALIZATION_TAG', 'OPERATOR', 'PROMOTER', 'SCAR', 'SPACER', 'RBS', 'RIBOZYME', 'TERMINATOR'),
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive(),
          parameters: Joi.array().items(
            Joi.object().keys({
              name: Joi.string().optional(),
              units: Joi.string(), // These should be updated.
              value: Joi.number(),
              variable: Joi.string()
            })
          ).optional(),
          userSpace: Joi.boolean().default(false)
        }
      }
    },

    handler: function (request, reply) {

      var req = {
        method: 'PUT',
        url: '/api/part',
        payload: request.payload
      };

      var i;
      var sequence = [];
      var response = server.inject(req, (response) => {
        try{  // If there is an error then there was no part in the db that matched the sequence
          for (i = 0; i < response[0].parts[0].sequences.length(); i++) {
            sequence.push({seq: response[0].parts[0].sequences[i].sequence,
              seqId: response[0].parts[0].sequences[i]._id,
              name: response[0].parts[0].sequences[i].name
            });
          }
        } catch(e) {
          return e;
        }
      });


      // var sequence = {
      //   seq: request.payload.sequence,
      //   seqId: request.payload.displayId,
      //   name: request.payload.name
      // };

      const randomNum = Math.floor(Math.random()*1000)+1; // Random number generator to create random temp directory name
      const directory = './blast/temp' + randomNum.toString();
      const mkdir = execFile('mkdir', ['-p', directory], (err, stdout, stderr) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully created temp directory.');
        }
      });

      var fileContent = '';
      for(i = 0; i < sequence.length; i++) {
        fileContent += '> ' + sequence[i].name + '-' + sequence[i].seqId + '\n' + sequence[i].seq + '\n\n';
      }

      // var fileContent = '> ' + sequence.name + '-' + sequence.seqId + '\n' + sequence.seq;  // Content of the fasta file
      var fileLocation = directory + '/' + sequence.name + '.fasta';  // File name and location
      fs.writeFile(fileLocation, fileContent, function (err) {  // Write the fasta file
        if (err) {
          console.log(err);
        } else {
          console.log('FASTA file was saved.');
        }
      });

      reply.file(fileLocation); // Reply with the fasta file

      const deleteDir = execFile('rm', ['-rf', directory], (err, stdout, stderr) => {
          if (err){
            console.log(err);
          } else {
            console.log('Temp directory was successfully deleted');
          }
      });
    }
  });

  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'blast'
};

