'use strict';

const Joi = require('joi');
const { execFile } = require('child_process');
const fs = require('fs');
const wreck = require('wreck');

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
          name: Joi.string().required(),
          displayId: Joi.string().optional(),
          role: Joi.string().valid('BARCODE', 'CDS', 'DEGRADATION_TAG', 'GENE', 'LOCALIZATION_TAG', 'OPERATOR', 'PROMOTER', 'SCAR', 'SPACER', 'RBS', 'RIBOZYME', 'TERMINATOR'),
          parameters: Joi.array().items(Joi.object()).optional(), // assumed to be of the format (value, variable)
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive()
        }
      }
    },

    handler: function (request, reply) {
      const payload = request.payload;
      var sequence = wreck.post('./api/part', {payload: payload}, (err, res, payload) => {
        return {
          seq: res[0].parts[0].sequences[0].sequence,
          seqId: res[0].parts[0].sequences[0]._id,
          name: res[0].parts[0].sequences[0].name
        };
      });
      // var sequence = $.post('/api/part', payload, function (data) {
      //   return {
      //     seq: data[0].parts[0].sequences[0].sequence,
      //     seqId: data[0].parts[0].sequences[0]._id,
      //     name: data[0].parts[0].sequences[0].name
      //   };
      // });

      const directory = './blast/temp' + sequence.seqId;
      const mkdir = execFile('mkdir', ['-p', directory], (err, stdout, stderr) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully created temp directory.');
        }
      });

      var fileContent = '> ' + sequence.name + '-' + sequence.seqId + '\n' + sequence.seq;  // Content of the fasta file
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

