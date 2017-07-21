'use strict';
const Async = require('async');
const Boom = require('boom');
const Config = require('../../config');
const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {



  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'root'
};
