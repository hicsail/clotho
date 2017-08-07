'use strict';
const Package = require('../../package');

const internals = {};


internals.applyRoutes = function (server, next) {

  /**
   * @api {get} /clotho/version Version
   * @apiName Version
   * @apiDescription get current version of running clotho
   * @apiGroup Clotho
   * @apiVersion 4.0.0
   * @apiPermission none
   *
   *
   * @apiSuccessExample {json} Success-Response:
   * {"version":"4.0.0"}
   */
  server.route({
    method: 'GET',
    path: '/version',
    handler: function (request, reply) {

      return reply({version: Package.version});
    }
  });

  /**
   * @api {get} /clotho/repository Repository
   * @apiName Repository
   * @apiDescription get current repository of running clotho
   * @apiGroup Clotho
   * @apiVersion 4.0.0
   * @apiPermission none
   *
   *
   * @apiSuccessExample {json} Success-Response:
   * {"repository":"https://github.com/hicsail/clotho"}
   */
  server.route({
    method: 'GET',
    path: '/repository',
    handler: function (request, reply) {

      return reply({repository: Package.repository.url});
    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency([], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'clotho'
};
