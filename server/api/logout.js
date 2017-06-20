'use strict';
const Boom = require('boom');


const internals = {};


internals.applyRoutes = function (server, next) {

  const Session = server.plugins['hapi-mongo-models'].Session;

  /**
   * @api {delete} /api/logout Logout
   * @apiName Logout
   * @apiDescription Remove Users Session
   * @apiGroup Authentication
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   * "message": "Success."
   * }
   *
   * @apiErrorExample {json} 401:
   * {
   *  "statusCode": 401,
   *  "error": "Unauthorized",
   *  "message": "Missing authentication."
   * }
   *
   * @apiErrorExample {json} 404:
   * {
   *  "statusCode": 404,
   *  "error": "Not Found",
   *  "message": "Document not found."
   * }
   *
   *
   */
  server.route({
    method: 'DELETE',
    path: '/logout',
    config: {
      auth: {
        mode: 'try',
        strategy: 'simple'
      }
    },
    handler: function (request, reply) {

      const credentials = request.auth.credentials || {session: {}};
      const session = credentials.session || {};

      if(!request.auth.isAuthenticated) {
        return reply(Boom.unauthorized('Missing authentication'));
      }

      Session.findByIdAndDelete(session._id, (err, sessionDoc) => {

        if (err) {
          return reply(err);
        }

        if (!sessionDoc) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply({message: 'Success.'});
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
  name: 'logout'
};
