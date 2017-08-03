'use strict';
const Bionode = require('bionode-seq');
const Joi = require('joi');

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
   * @apiParamExample {json} Protein:
   *  {
   *    "sequence":"MAYKSGKRPTFFEVFKAHCSDS"
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
   * @apiSuccessExample {json} Protein:
   *  {
   *    "type":"protein"
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
          sequence: Joi.string().required()
        }
      }
    },
    handler: function (request, reply) {

      return reply({type: Bionode.checkType(request.payload.sequence)});
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
          sequence: Joi.string().required()
        }
      }
    },
    handler: function (request, reply) {

      return reply({sequence: Bionode.reverse(request.payload.sequence)});
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
          sequence: Joi.string().required()
        }
      }
    },
    handler: function (request, reply) {

      return reply({sequence: Bionode.complement(request.payload.sequence)});
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
          sequence: Joi.string().required()
        }
      }
    },
    handler: function (request, reply) {

      return reply({sequence: Bionode.reverseComplement(request.payload.sequence)});
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
          sequence: Joi.string().required(),
          exons: Joi.array().items(
            Joi.array().items(
              Joi.number().min(0)
            ).length(2).required()
          ).required()
        }
      }
    },
    handler: function (request, reply) {

      return reply({sequence: Bionode.removeIntrons(request.payload.sequence, request.payload.exons)});
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
          sequence: Joi.string().required(),
          exons: Joi.array().items(
            Joi.array().items(
              Joi.number().min(0)
            ).length(2).required()
          ).required()
        }
      }
    },
    handler: function (request, reply) {

      return reply({sequence: Bionode.removeIntrons(request.payload.sequence, Bionode.reverseExons(request.payload.exons, request.payload.sequence.length))});
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
        strategy: 'simple'
      },
      validate: {
        payload: {
          sequence: Joi.string().required()
        }
      }
    },
    handler: function (request, reply) {

      return reply({sequence: Bionode.transcribe(request.payload.sequence)});
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
