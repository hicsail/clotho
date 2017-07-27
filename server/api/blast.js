'use strict';

const Async = require('async');
const {exec} = require('child_process');
const Fs = require('fs');
const Joi = require('joi');
const UUID = require('uuid/v4');
const Blast = require('blastjs');
const Path = require('path');

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
        sequences: ['Parts', function (results, callback) {

          //get sequences from parts
          var sequences = [];
          for (var part of results.Parts) {
            var sequence = {};
            sequence.id = part._id;
            sequence.name = part.name;
            sequence.description = (part.description) ? part.description : '';
            sequence.sequence = part.subparts[0].sequences[0].sequence;
            sequences.push(sequence);
          }
          callback(null, sequences);
        }],
        fasta: ['sequences', function (results, callback) {

          var fileContent = '';
          for (var sequence of results.sequences) {
            fileContent += `> ${sequence.name}--${sequence.id}--${sequence.description}\n${sequence.sequence}\n\n`;
          }

          callback(null, fileContent);
        }],
      }, function (err, results) {

        if (err) {
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

      Async.auto({
        ID: function (callback) {

          callback(null, UUID());
        },
        fastaFile: function (callback) {  // Done

          var fastaRequest = {
            method: 'POST',
            url: '/api/blast/fasta',
            payload: {
              name: request.payload.name,
              displayId: request.payload.displayId,
              role: request.payload.role,
              sequence: request.payload.sequence,
              parameters: request.payload.parameters,
              userSpace: request.payload.userSpace
            },
            credentials: request.auth.credentials
          };

          server.inject(fastaRequest, (response) => {

            if (response.statusCode != 200) {  // Error
              return callback(response.result);
            }
            callback(null, response.result);
          });
        },
        mkdir: [ 'ID', function (results,callback) {  // Done

          const directory = Path.join(__dirname,`../blast/${results.ID}`);
          exec(`mkdir -p '${directory}'`, (error, stdout, stderr) => {

            if (error) {
             callback(error);
            }

            callback(null, directory);
          });

        }],
        writeFile: ['mkdir', 'fastaFile', function (results, callback) { // Need to put appropriate file name

          const filePath = `${results.mkdir}/sequences.fasta`;
          Fs.writeFile(filePath, results.fastaFile, (err) => {

            if (err) {
              callback(err);
            }
            callback(null, filePath);
          });
        }],
        blastMakeDB: ['writeFile', function (results, callback) {

          var type = 'nucl';
          var fileIn =  `./server/blast/${results.ID}/sequences.fasta`;
          var outPath = `./server/blast/${results.ID}/`;

          // Make DB
          Blast.makeDB(type, fileIn, outPath, null, (err) => {

            callback(err, outPath);
          });
        }],
        blastN: ['blastMakeDB', function (results, callback) {

          var dbPath = results.blastMakeDB +'/sequences';
          var query = '> Query Sequence\n' + request.payload.BLASTsequence;

          // blastN
          Blast.blastN(dbPath, query, callback);
        }],
      }, (err, results) => {
        removeDir(results.mkdir)
        if (err) {
          return reply(err);
        }
        var result = parse(results.blastN);
        reply(result);
      });
    }
  });
  next();
};

function removeDir(dir) {
  exec(`rm -rf '${dir}'`, (error, stdout, stderr) => {});
}

function parse(blastInput) {

  var blastOutput = {};
  var hits = blastInput.BlastOutput.BlastOutput_iterations[0].Iteration[0].Iteration_hits[0].Hit;
  if(hits != undefined){
    for(var hit of hits) {
      if(hit != '\n') {
        var hitInfo = hit.Hit_def[0].split('--');
        if(!blastOutput[hitInfo[1]]) {
          blastOutput[hitInfo[1]] = {};
          blastOutput[hitInfo[1]].name = hitInfo[0];
          blastOutput[hitInfo[1]].description = hitInfo[2];
          blastOutput[hitInfo[1]].hits = [];
        }
        var hspList = hit.Hit_hsps[0].Hsp;
        for (var hsp of hspList) {
          blastOutput[hitInfo[1]].hits.push({
            number: parseInt(hsp.Hsp_num[0]),
            score: parseFloat(hsp['Hsp_bit-score'][0]),
            from: parseInt(hsp['Hsp_hit-from'][0]),
            to: parseInt(hsp['Hsp_hit-to'][0]),
            gaps: parseInt(hsp.Hsp_gaps[0]),
            sequence: hsp.Hsp_hseq[0],
            midline: hsp.Hsp_midline[0]
          });
        }
      }
    }
  }
  return blastOutput;
}

exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'blast'
};

