'use strict';

const Joi = require('joi');
const { execFile } = require('child_process');
const fs = require('fs');
const Async = require('async');
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
          role: Joi.string().valid('BARCODE', 'CDS', 'DEGRADATION_TAG', 'GENE', 'TEST', 'LOCALIZATION_TAG', 'OPERATOR', 'PROMOTER', 'SCAR', 'SPACER', 'RBS', 'RIBOZYME', 'TERMINATOR'),
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

      Async.autoInject({
        sequence: function (callback) {
          var req = {
            method: 'PUT',
            url: '/api/part',
            payload: request.payload,
            credentials: request.auth.credentials
          };

          var i;
          var j;
          var sequence = [];
          var response = server.inject(req, (response) => {
            try{  // If there is an error then there was no part in the db that matched the sequence
              console.log(response.result[0].subparts);
              for (i = 0; i < response.result[0].subparts.length(); i++) {
                for (j = 0; j < response.result[0].subparts[i].sequences.length(); j++){
                  sequence.push({seq: response.result[0].subparts[i].sequences[j].sequence,
                    seqId: response.result[0].subparts[i].sequences[j]._id,
                    name: response.result[0].subparts[i].sequences[j].name
                  });
                }

              }
              callback(null, sequence);
            } catch(e) {
              console.log('error');
              console.log(e + '\n\n\n');
            }
          });
        },
        mkdir: function (callback) {
          const randomNum = Math.floor(Math.random()*1000)+1; // Random number generator to create random temp directory name
          const directory = './blast/temp' + randomNum.toString();
          const mkdir = execFile('mkdir', ['-p', directory], (err, stdout, stderr) => {
              if (err) {
                console.log(err);
              } else {
                console.log('Successfully created temp directory.');
                callback(directory);
              }
          });
        },
        fileContent: ['sequence', 'mkdir', function (sequence, mkdir, callback) {
          var fileContent = '';
          for(i = 0; i < sequence.length; i++) {
            fileContent += '> ' + sequence[i].name + '-' + sequence[i].seqId + '\n' + sequence[i].seq + '\n\n';
          }

          // var fileContent = '> ' + sequence.name + '-' + sequence.seqId + '\n' + sequence.seq;  // Content of the fasta file
          var fileLocation = directory + '/' + sequence.name + '.fasta';  // File name and location
          callback(null,fileContent, fileLocation);
        }],
        writeFile: ['fileContent', function (fileContent, callback) {
          fs.writeFile(fileLocation, fileContent, function (err) {  // Write the fasta file
            if (err) {
              console.log(err);
            } else {
              console.log('FASTA file was saved.');
            }
          });
          reply.file(fileLocation); // Reply with the fasta file
        }],
        deleteDir: ['writeFile', 'mkdir', function (writeFile, mkdir, callback) {
          const deleteDir = execFile('rm', ['-rf', directory], (err, stdout, stderr) => {
            if (err){
              console.log(err);
            } else {
              console.log('Temp directory was successfully deleted');
            }
          });
        }]
      }, function (err, results) {
        console.log('err= ', err);
      });

      // var sequence = {
      //   seq: request.payload.sequence,
      //   seqId: request.payload.displayId,
      //   name: request.payload.name
      // };
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

