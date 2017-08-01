'use strict';
const Bionode = require('bionode-seq');
const Boom = require('boom');
const Joi = require('joi');
const Request = require('request');
const Rp = require('request-promise');
const Function = require('../models/function');

const internals = {};


internals.applyRoutes = function (server, next) {

  /**
   * @api {post} /api/checkType Check Type
   * @apiName Check Type
   * @apiDescription Get the type of a given DNA Sequence
   * @apiGroup Functions
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} sequence  A DNA Sequence.
   *
   * @apiParamExample {json} DNA:
   *  {
   *    "sequence":"ATGACCCTGAGAAGAGCACCG"
   *  }
   *
   * @apiParamExample {json} RNA:
   *  {
   *    "sequence":"AUGACCCUGAAGGUGAAUGAA"
   *  }
   *
   *
   * @apiParamExample {json} Ambiguous DNA:
   *  {
   *    "sequence":"AMTGACCCTGAGAAGAGCACCG"
   *  }
   *
   * @apiParamExample {json} Ambiguous RNA:
   *  {
   *    "sequence":"AMUGACCCUGAAGGUGAAUGAA"
   *  }
   *
   * @apiSuccessExample {json} DNA:
   *  {
   *    "type":"dna"
   *  }
   *
   * @apiSuccessExample {json} RNA:
   *  {
   *    "type":"rna"
   *  }
   *
   * @apiSuccessExample {json} Ambiguous DNA:
   *  {
   *    "type":"ambiguousDna"
   *  }
   *
   * @apiSuccessExample {json} Ambiguous RNA:
   *  {
   *    "type":"ambiguousRna"
   *  }
   */
  server.route({
    method: 'POST',
    path: '/checkType',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/,'DNA sequence').required()
        }
      }
    },
    handler: function (request, reply) {

      return reply({type:Bionode.checkType(request.payload.sequence)});
    }
  });


  /**
   * @api {post} /api/reverse Reverse
   * @apiName Reverse Sequence
   * @apiDescription Takes a sequence and returns the reverse sequence.
   * @apiGroup Functions
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} sequence  A DNA Sequence.
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "sequence":"ATGACCCTGAAGGTGAA"
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "sequence":"AAGTGGAAGTCCCAGTA"
   *  }
   *
   */
  server.route({
    method: 'POST',
    path: '/reverse',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/,'DNA sequence').required()
        }
      }
    },
    handler: function (request, reply) {

      return reply({sequence:Bionode.reverse(request.payload.sequence)});
    }
  });

  /**
   * @api {post} /api/complement Complement
   * @apiName Complement
   * @apiDescription Takes a sequence and returns its complement.
   * @apiGroup Functions
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} sequence  A DNA Sequence.
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "sequence":"ATGACCCTGAAGGTGAA"
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "sequence":"TACTGGGACTTCCACTT"
   *  }
   *
   */
  server.route({
    method: 'POST',
    path: '/complement',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/,'DNA sequence').required()
        }
      }
    },
    handler: function (request, reply) {

      return reply({sequence:Bionode.complement(request.payload.sequence)});
    }
  });


  /**
   * @api {post} /api/reversecomplement Reverse Complement
   * @apiName Reverse Complement
   * @apiDescription Takes a sequence and returns its reverse complement.
   * @apiGroup Functions
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} sequence  A DNA Sequence.
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "sequence":"ATGACCCTGAAGGTGAA"
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "sequence":"TTCACCTTCAGGGTCAT"
   *  }
   *
   */
  server.route({
    method: 'POST',
    path: '/reversecomplement',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/,'DNA sequence').required()
        }
      }
    },
    handler: function (request, reply) {

      return reply({sequence:Bionode.reverseComplement(request.payload.sequence)});
    }
  });


  /**
   * @api {post} /api/removeIntrons Remove Introns
   * @apiName Remove Introns
   * @apiDescription Take a sequence and an array of exonsRanges and removes them.
   * @apiGroup Functions
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} sequence  A DNA Sequence.
   * @apiParam {Array} exons  An Array of integer arrays of exons Ranges. [A,B] A inclusive, B is exclusive
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "sequence":"ATGACCCTGAAGGTGAATGACAG",
   *    "exons": [[1,8]]
   *  }
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "sequence":"ATGACCCTGAAGGTGAATGACAG",
   *    "exons": [[2, 9], [12, 20]]
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "sequence":"TGACCCT"
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "sequence":"GACCCTGGTGAATGA"
   *  }
   *
   */
  server.route({
    method: 'POST',
    path: '/removeIntrons',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/,'DNA sequence').required(),
          exons:
            Joi.array().items(
              Joi.array().items(
                Joi.number().min(0)
              ).length(2).required()
            ).required()
        }
      }
    },
    handler: function (request, reply) {

      return reply({sequence:Bionode.removeIntrons(request.payload.sequence,request.payload.exons)});
    }
  });

  /**
   * @api {post} /api/removeExons Remove Exons
   * @apiName Remove Exons
   * @apiDescription Take a sequence and an array of exonsRanges and removes the introns.
   * @apiGroup Functions
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} sequence  A DNA Sequence.
   * @apiParam {Array} exons  An Array of integer arrays of exons Ranges. [A,B] A inclusive, B is exclusive
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "sequence":"ATGACCCTGAAGGTGAATGACAG",
   *    "exons": [[1,8]]
   *  }
   *
   * @apiParamExample {json} Request-Example:
   *  {
   *    "sequence":"ATGACCCTGAAGGTGAATGACAG",
   *    "exons": [[2, 9], [12, 20]]
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "sequence":"AATGACA"
   *  }
   *
   * @apiSuccessExample {json} Success-Response:
   *  {
   *    "sequence":"ACCCTGAAGAATGAC"
   *  }
   *
   */
  server.route({
    method: 'POST',
    path: '/removeExons',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/,'DNA sequence').required(),
          exons:
            Joi.array().items(
              Joi.array().items(
                Joi.number().min(0)
              ).length(2).required()
            ).required()
        }
      }
    },
    handler: function (request, reply) {

      return reply({sequence:Bionode.removeIntrons(request.payload.sequence,Bionode.reverseExons(request.payload.exons, request.payload.sequence.length))});
    }
  });

  /**
   * @api {post} /api/transcribe Transcribe
   * @apiName Transcribe
   * @apiDescription Takes a sequence and returns the transcribed sequence DNA <--> RNA
   * @apiGroup Functions
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} sequence  A DNA Sequence.
   *
   * @apiParamExample {json} Request-Example-1:
   *  {
   *    "sequence":"ATGACCCTGAAGGTGAA"
   *  }
   *
   * @apiParamExample {json} Request-Example-2:
   *  {
   *    "sequence":"AUGACCCUGAAGGUGAA"
   *  }
   *
   * @apiSuccessExample {json} Success-Response-1:
   *  {
   *    "sequence":"AUGACCCUGAAGGUGAA"
   *  }
   *
   * @apiSuccessExample {json} Success-Response-2:
   *  {
   *    "sequence":"ATGACCCTGAAGGTGAA"
   *  }
   *
   */
  server.route({
    method: 'POST',
    path: '/transcribe',
    config: {
      auth: {
        strategies: ['simple','session']
      },
      validate: {
        payload: {
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/,'DNA sequence').required()
        }
      }
    },
    handler: function (request, reply) {

      return reply({sequence:Bionode.transcribe(request.payload.sequence)});
    }
  });

  /**
   * @api {get} /api/function/language Get Languages
   * @apiName Get Languages
   * @apiDescription Get available languages to write custom function
   * @apiGroup Custom Functions
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiSuccessExample {json} Success-Response-1:
   *  ["node","java","python"]
   *
   */
  server.route({
    method: 'GET',
    path: '/function/language',
    config: {
      auth: {
        strategy: 'simple'
      },
    },
    handler: function (request, reply) {

      Request('http://localhost:8000/language', (error, response, body) => {

        reply(JSON.parse(body));
      });
    }
  });

  /**
   * @api {get} /api/function/version Get Versions
   * @apiName Get Versions
   * @apiDescription Get available languages version
   * @apiGroup Custom Functions
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiSuccessExample {json} Success-Response-1:
   *  {"java":"1.8.0_102","node":"v7.9.0","python":"Python 2.7.10"}
   *
   */
  server.route({
    method: 'GET',
    path: '/function/version',
    config: {
      auth: {
        strategy: 'simple'
      },
    },
    handler: function (request, reply) {

      Request('http://localhost:8000/version', (error, response, body) => {

        reply(JSON.parse(body));
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/function/template/{language*}',
    config: {
      auth: {
        strategies: ['simple','session']
      },
    },
    handler: function (request, reply) {

      Request(`http://localhost:8000/public/templates/${request.params.language}.txt`, (error, response, body) => {

        reply(body);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/function/run',
    config: {
      auth: {
        strategies: ['simple','session']
      },
      pre: [{
        assign: 'validInput',
        method: function (request, reply) {

          if(!request.payload) {
            return reply(Boom.badRequest('Request must have body'));
          }

          Request.get('http://localhost:8000/language', (err, httpResponse, body) => {

            var payload = {};
            var data = request.payload.split('\n');
            var firstLine = data[0].split(' ');
            payload.language = firstLine[0];
            payload.inputs = JSON.parse(firstLine.slice(1).join(' '));
            payload.code = data.slice(1).join('\n');
            var languages = JSON.parse(body);

            const schema = {
              language: Joi.string().allow(languages).required(),
              inputs: Joi.array().required(),
              code: Joi.string().required()
            };

            var validate = Joi.validate(payload,schema);

            if(validate.error) {
              return reply(Boom.badRequest(validate.err));
            }

            if(languages.indexOf(payload.language) == -1) {
              return reply(Boom.badRequest('invalid language'));
            }

            reply(true);
          });
        }
      }]
    },
    handler: function (request, reply) {

      Rp({
        method: 'POST',
        uri: 'http://localhost:8000/compile',
        body: request.payload,
        headers: {'Content-Type':'text/plain'},
        json: false
      }).then(function (parsedBody) {

        return reply(parsedBody);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/function',
    config: {
      auth: {
        strategies: ['simple','session']
      },
      validate: {
        payload: {
          name: Joi.string().required(),
          description: Joi.string().optional(),
          language: Joi.string().required(),
          code: Joi.array().required(),
          inputs: Joi.array().required(),
          outputs: Joi.array().required()
        }
      }
    },
    handler: function (request, reply) {
      console.log('reached Handler in /api/function');
      var input = `["${request.payload.inputs.join(',')}"]`;
      var payload = `${request.payload.language} ${input}\n ${request.payload.code.join('\n')}`;
      const runRequest = {
        method: 'POST',
        url: '/function/run',
        payload: payload,
        headers: {
          'Content-Type': 'text/plain'
        },
        credentials: request.auth.credentials
      };

      server.inject(runRequest, (response) => {
        console.log('Inside of server.inject')

        if(response.statusCode != 200) {
          return reply(response.result);
        }
        var output = response.result.split('\n').slice(0,-1);
        if(output.toString() != request.payload.outputs.toString()) {
          return reply(Boom.badRequest(`Inputs don't produce outputs\n ${request.result}`));
        }

        Function.create(
          request.payload.name,
          request.payload.description,
          request.auth.credentials.user._id.toString(),
          request.payload.language,
          request.payload.code,
          request.payload.inputs,
          request.payload.outputs,
          true,
          (err, result) => {

            reply(result);
          });
      });
    }
  });


  next();
};


exports.register = function (server, options, next) {

  server.dependency([], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'functions'
};
