'use strict';

const Async = require('async');
const { exec } = require('child_process');
const Fs = require('fs');
const Joi = require('joi');
const UUID = require('uuid/v4');
const blast = require('blastjs');

const internals = {};

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'POST',
    path: '/blast/fasta',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().optional(),
          displayId: Joi.string().optional(),
          role: Joi.string().optional(),
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

      Async.auto({
        Parts: function (callback) {

          //get parts based upon payload
          var req = {
            method: 'PUT',
            url: '/api/part',
            payload: request.payload,
            credentials: request.auth.credentials
          };

          server.inject(req, (response) => {

            if (response.statusCode != 200) {
              return callback(response.result);
            }
            callback(null, response.result);

          });
        },
        sequences: ['Parts', function(results, callback) {

          //get sequences from parts
          var sequences = [];
          for(var part of results.Parts) {
            var sequence = {};
            sequence.id = part._id;
            sequence.name = part.name;
            sequence.description = (part.description) ? part.description : '';
            sequence.sequence = part.subparts[0].sequences[0].sequence;
            sequences.push(sequence);
          }
          callback(null,sequences);
        }],
        /*
        NO NEED TO MAKE FILE, SAVED FOR BLAST ROUTE
        mkdir: function (callback) {

          const randomNum = Math.floor(Math.random()*1000)+1; // Random number generator to create random temp directory name
          const directory = './blast/temp' + randomNum.toString();
          exec('mkdir', ['-p', directory], (error, stdout, stderr) => {

            if (error) {
              callback(error);
            } else {
              data.directory = directory; // Add directory path into the data object
              callback(null, 'directory');
            }
          });
        },
        */
        fasta: ['sequences', function (results, callback) {

          var fileContent = '';
          for(var sequence of results.sequences) {
            fileContent += `> ${sequence.name}-${sequence.id}-${sequence.description}\n${sequence.sequence}\n\n`;
          }

          callback(null, fileContent);
        }],
        /*
        DO NEED TO WRITE FILE, SAVED FOR BLAST ROUTE
        writeFile: ['fileContent', function (results, callback) {

          var fileLocation = data.fileLocation; // reference fileLocation element in data object
          var fileContent = data.fileContent; // reference fileContent element in data object

          Fs.writeFile(fileLocation, fileContent, function (err) {  // Write the fasta file
            if (err) {
              callback(err);
            }
          });
          reply.file(fileLocation); // Reply with the fasta file
          callback(null, 'replyFile');
        }],
        */
        /*
        DO NEED TO DELETE DIR, SAVED FOR BLAST ROUTE
        deleteDir: ['writeFile', 'mkdir', function (results, callback) {

          var directory = data.directory; // reference directory element in data object
          const deleteDir = exec('rm', ['-rf', directory], (err, stdout, stderr) => {
            if (err){
              return callback(err);
            }
            return callback(null, 'deleteDir');
          });
        }]*/
      }, function (err, results) {

        if(err) {
          return reply(err);
        }
        reply(results.fasta);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/blast',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().optional(),
          displayId: Joi.string().optional(),
          role: Joi.string().optional(),
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive(),
          parameters: Joi.array().items(
            Joi.object().keys({
              name: Joi.string().optional(),
              units: Joi.string(), // These should be updated.
              value: Joi.number(),
              variable: Joi.string()
            })
          ).optional(),
          BLASTsequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').required(),
          userSpace: Joi.boolean().default(false)
        }
      }
    },
    handler: function (request, reply) {
      var data = {};

      Async.auto({
        ID: function (callback) { // Dont really need this because I can just call the UUID in mkdir

          //get unique ID for directory path
          callback(null,UUID());
        },
        fastaFile: function (callback) {  // Done

          var payload1 = {name: request.payload.name,
          displayId: request.payload.displayId,
          role: request.payload.role,
          sequence: request.payload.sequence,
          parameters: request.payload.parameters,
          userSpace: request.payload.userSpace
          }

          var fastaRequest = {
            method: 'POST',
            url: '/api/blast/fasta',
            payload: payload1,
            credentials: request.auth.credentials
          }

          server.inject(fastaRequest, (response) => {

            if(response.statusCode != 200) {  // Error
              return callback(response.result);
            }

            data.fastaFile = response.result;
            callback(null, response.result);
          });
        },
        mkdir: function (callback) {  // Done
          const folder = 'temp' + UUID();
          const directory = './server/blast/' + folder;
          exec(`mkdir -p ${directory}`, (error, stdout, stderr) => {

            if (error) throw error;
            data.folder = folder; // Add folder name into the data object
            data.directory = directory; // Add directory path into the data object
            callback(null, 'directory');
          });

        },
        writeFile: ['mkdir', 'fastaFile', function (results, callback) { // Need to put appropriate file name

          var fileName = 'filename.fasta';
          data.fileLocation = data.directory + '/' + fileName;  // ./server/blast/temp + UUID()
          data.fileName = fileName; // filename.fasta

          Fs.writeFile(data.fileLocation, data.fastaFile, (err) => {
            if (err) throw err;
            callback(null, 'writeFile');
          });
        }],
        blastMakeDB: ['mkdir', 'fastaFile', 'writeFile', function (results, callback) {

          var type = 'nucl';
          var fileIn = './server/blast/' + data.folder + "/" + data.fileName; // ./server/blast/tempUUID()/filename.fasta
          var outPath = './server/blast/' + data.folder + '/';  // ./server/blast/tempUUID()/
          data.outPath = outPath;
          console.log('\n\n');

          // Make DB
          blast.makeDB(type, fileIn, outPath, null, function (err) {
            if (err) throw err;
            console.log('Database created at ' + outPath);
            callback(null, 'makeDB');
          });
        }],
        blastN: ['blastMakeDB', function (results, callback) {

          var dbPath = data.outPath + 'filename';  // ./server/blast/tempUUID()/filename.nhr
          var query = '> Query Sequence\n' + request.payload.BLASTsequence;
          console.log('\n\n');

          // blastN
          blast.blastN(dbPath, query, function (err, output) {
            if (err) throw err;
            reply(parse(output));
            callback(null, 'blastN');
          });

          function parse(s) {
            var obj = {};

            var hit = s.BlastOutput.BlastOutput_iterations[0].Iteration[0].Iteration_hits[0].Hit[0];
            var hit_defArray = hit.Hit_def[0].split('--');
            obj[hit_defArray[1]] = {};
            obj[hit_defArray[1]].name = hit_defArray[0];
            obj[hit_defArray[1]].hits = [];

            var temp = hit.Hit_hsps[0].Hsp;
            for (var i = 0; i < temp.length; i++) {
              obj[hit_defArray[1]].hits.push({number: parseInt(temp[i].Hsp_num[0]),
                score: parseFloat(temp[i]['Hsp_bit-score'][0]),
                from: parseInt(temp[i]['Hsp_query-from'][0]),
                to: parseInt(temp[i]['Hsp_query-to'][0]),
                gaps: parseInt(temp[i].Hsp_gaps[0]),
                sequence: temp[i].Hsp_hseq[0],
                midline: temp[i].Hsp_midline[0]
              });
            }
            return obj;
          }
        }],
        rmDir: ['blastMakeDB', 'blastN', function (results, callback) {  // Done

          exec(`rm -rf ${data.directory}`, (error, stdout, stderr) => {
            if (error) {
              throw error;
            } else {
              console.log('Directory Deleted: ' + data.directory);
              callback(null, 'directory');
            }
          });
        }]
      }, (err, results) => {

        if(err) {
          return reply(err);
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

