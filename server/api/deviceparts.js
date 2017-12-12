'use strict';
const Joi = require('joi');
const Async = require('async');

const internals = {};

internals.applyRoutes = function (server, next) {


  const BioDesign = server.plugins['hapi-mongo-models'].BioDesign;

  server.route({
    method: 'PUT',
    path: '/bioDesign/search',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().optional(),
          displayId: Joi.string().optional(),
          limit: Joi.number().default(20),
          page: Joi.number().default(1),
          userSpace: Joi.boolean().default(false),
          type: Joi.string().allow(['PART','DEVICE']).optional()
        }
      }
    },
    handler: function (request, reply) {

      const query = {};
      const limit = request.query.limit;
      const page = request.query.page;

      if(request.payload.name) {
        query.name = { $regex: request.payload.name, $options: 'i'}
      }

      if(request.payload.displayId) {
        query.displayId = { $regex: request.payload.displayId, $options: 'i'}
      }

      if(request.payload.type) {
        query.type = request.payload.type;
      }

      Async.auto({
        bioDesign: function (done) {

          BioDesign.pagedFind(query, null, null, limit, page, done);
        },
        parts: ['bioDesign', function (results, done) {

          const biodesigns = [];

          Async.each(results.bioDesign.data, (bioDesign, eachCallback) => {

            if(bioDesign.subBioDesignIds) {

              var newRequest = {
                url: '/api/device/' + bioDesign._id,
                method: 'GET',
                credentials: request.auth.credentials
              };

              server.inject(newRequest, (response) => {

                biodesigns.push(response.result[0]);
                eachCallback();
              });

            } else {

              var newRequest = {
                url: '/api/part/' + bioDesign._id,
                method: 'GET',
                credentials: request.auth.credentials
              };

              server.inject(newRequest, (response) => {

                biodesigns.push(response.result);
                eachCallback();
              });
            }
          },(err) => {

            if(err) {
              reply(err);
            }

            return reply(results.bioDesign)
          });
        }]
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/device/search/contains',
    config: {
      auth: {
        strategy: 'simple'
      },
      validate: {
        payload: {
          name: Joi.string().optional(),
          displayId: Joi.string().optional(),
          type: Joi.string().allow('PART','DEVICE').optional(),
          limit: Joi.number().default(20),
          page: Joi.number().default(1),
        }
      }
    },
    handler: function (request, reply) {

      const query = {type: 'PART'};
      const limit = request.query.limit;
      const page = request.query.page;

      if(request.payload.type) {
        query.type = request.payload.type
      }

      if(request.payload.name) {
        query.name = { $regex: request.payload.name, $options: 'i'}
      }

      if(request.payload.displayId) {
        query.displayId = { $regex: request.payload.displayId, $options: 'i'}
      }

      Async.auto({
        bioDesign: function (done) {

          BioDesign.pagedFind(query, null, null, limit, page, done);
        },
        devices: ['bioDesign', function (results,done) {

          let ids = [];
          for( let part of results.bioDesign.data) {
            ids.push(part._id.toString());
          }

          BioDesign.find({
            subBioDesignIds: {
              $in: ids
            }
          }, done);
        }]
      }, (err, results) => {

        reply(results.devices);
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
  name: 'deviceparts'
};
