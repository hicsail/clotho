'use strict';
const Async = require('async');
const AuthPlugin = require('../auth');
const Boom = require('boom');
const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {

  const Admin = server.plugins['hapi-mongo-models'].Admin;
  const User = server.plugins['hapi-mongo-models'].User;


  server.route({
    method: 'GET',
    path: '/admins',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        query: {
          fields: Joi.string(),
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1)
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      const query = {};
      const fields = request.query.fields;
      const sort = request.query.sort;
      const limit = request.query.limit;
      const page = request.query.page;

      Admin.pagedFind(query, fields, sort, limit, page, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results);
      });
    }
  });


  server.route({
    method: 'GET',
    path: '/admins/{id}',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      Admin.findById(request.params.id, (err, admin) => {

        if (err) {
          return reply(err);
        }

        if (!admin) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(admin);
      });
    }
  });


  server.route({
    method: 'POST',
    path: '/admins',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        payload: {
          name: Joi.string().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      const name = request.payload.name;

      Admin.create(name, (err, admin) => {

        if (err) {
          return reply(err);
        }

        reply(admin);
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/admins/{id}',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        params: {
          id: Joi.string().invalid('111111111111111111111111')
        },
        payload: {
          name: Joi.object().keys({
            first: Joi.string().required(),
            middle: Joi.string().allow(''),
            last: Joi.string().required()
          }).required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          name: request.payload.name
        }
      };

      Admin.findByIdAndUpdate(id, update, (err, admin) => {

        if (err) {
          return reply(err);
        }

        if (!admin) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(admin);
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/admins/{id}/permissions',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        params: {
          id: Joi.string().invalid('111111111111111111111111')
        },
        payload: {
          permissions: Joi.object().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          permissions: request.payload.permissions
        }
      };

      Admin.findByIdAndUpdate(id, update, (err, admin) => {

        if (err) {
          return reply(err);
        }

        reply(admin);
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/admins/{id}/groups',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        params: {
          id: Joi.string().invalid('111111111111111111111111')
        },
        payload: {
          groups: Joi.object().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {

      const id = request.params.id;
      const update = {
        $set: {
          groups: request.payload.groups
        }
      };

      Admin.findByIdAndUpdate(id, update, (err, admin) => {

        if (err) {
          return reply(err);
        }

        reply(admin);
      });
    }
  });


  server.route({
    method: 'PUT',
    path: '/admins/{id}/user',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        params: {
          id: Joi.string().invalid('111111111111111111111111')
        },
        payload: {
          username: Joi.string().lowercase().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root'),
        {
          assign: 'admin',
          method: function (request, reply) {

            Admin.findById(request.params.id, (err, admin) => {

              if (err) {
                return reply(err);
              }

              if (!admin) {
                return reply(Boom.notFound('Document not found.'));
              }

              reply(admin);
            });
          }
        }, {
          assign: 'user',
          method: function (request, reply) {

            User.findByUsername(request.payload.username, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (!user) {
                return reply(Boom.notFound('User document not found.'));
              }

              if (user.roles &&
                user.roles.admin &&
                user.roles.admin.id !== request.params.id) {

                return reply(Boom.conflict('User is already linked to another admin. Unlink first.'));
              }

              reply(user);
            });
          }
        }, {
          assign: 'userCheck',
          method: function (request, reply) {

            if (request.pre.admin.user &&
              request.pre.admin.user.id !== request.pre.user._id.toString()) {

              return reply(Boom.conflict('Admin is already linked to another user. Unlink first.'));
            }

            reply(true);
          }
        }
      ]
    },
    handler: function (request, reply) {

      Async.auto({
        admin: function (done) {

          const id = request.params.id;
          const update = {
            $set: {
              user: {
                id: request.pre.user._id.toString(),
                name: request.pre.user.username
              }
            }
          };

          Admin.findByIdAndUpdate(id, update, done);
        },
        user: function (done) {

          const id = request.pre.user._id;
          const update = {
            $set: {
              'roles.admin': {
                id: request.pre.admin._id.toString(),
                name: request.pre.admin.name.first + ' ' + request.pre.admin.name.last
              }
            }
          };

          User.findByIdAndUpdate(id, update, done);
        }
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results.admin);
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/admins/{id}/user',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        params: {
          id: Joi.string().invalid('111111111111111111111111')
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root'),
        {
          assign: 'admin',
          method: function (request, reply) {

            Admin.findById(request.params.id, (err, admin) => {

              if (err) {
                return reply(err);
              }

              if (!admin) {
                return reply(Boom.notFound('Document not found.'));
              }

              if (!admin.user || !admin.user.id) {
                return reply(admin).takeover();
              }

              reply(admin);
            });
          }
        }, {
          assign: 'user',
          method: function (request, reply) {

            User.findById(request.pre.admin.user.id, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (!user) {
                return reply(Boom.notFound('User document not found.'));
              }

              reply(user);
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      Async.auto({
        admin: function (done) {

          const id = request.params.id;
          const update = {
            $unset: {
              user: undefined
            }
          };

          Admin.findByIdAndUpdate(id, update, done);
        },
        user: function (done) {

          const id = request.pre.user._id.toString();
          const update = {
            $unset: {
              'roles.admin': undefined
            }
          };

          User.findByIdAndUpdate(id, update, done);
        }
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        reply(results.admin);
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/admins/promote',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        payload: {
          username: Joi.string().lowercase().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root'),
        {
          assign: 'user',
          method: function (request, reply) {

            User.findByUsername(request.payload.username, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (!user) {
                return reply(Boom.notFound('User document not found.'));
              }

              reply(user);
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      Async.auto({

        findAdmin: function (callback) {

          Admin.findByUsername(request.payload.username, callback);

        },
        createAdmin: ['findAdmin', function (results, callback) {

          if(!results.findAdmin) {

            const createRequest = {
              url: '/api/admins',
              method: 'POST',
              payload: {
                name: request.pre.user.name
              },
              credentials: request.auth.credentials
            };

            server.inject(createRequest, (response) => {

              if(response.statusCode != 200) {
                return callback(response.result);
              }
              callback(null,response.result);
            });
          }
        }],
        addUser:[ 'createAdmin', function (results,callback) {

          const createRequest = {
            url: `/api/admins/${results.createAdmin._id}/user`,
            method: 'PUT',
            payload: {
              username: request.pre.user.username
            },
            credentials: request.auth.credentials
          };

          server.inject(createRequest, (response) => {

            if(response.statusCode != 200) {
              return callback(response.result);
            }
            callback(null,response.result);
          });
        }],
        addPermissions: ['addUser', function (results,callback) {

          const createRequest = {
            url: `/api/admins/${results.createAdmin._id}/groups`,
            method: 'PUT',
            payload: {
              groups: {
                Root: 'root'
              }
            },
            credentials: request.auth.credentials
          };

          server.inject(createRequest, (response) => {

            if(response.statusCode != 200) {
              return callback(response.result);
            }
            callback(null,response.result);
          });
        }]
      }, (err, result) => {

        if(err) {
          return reply(err);
        }
        reply(result.addPermissions);
      });
    }
  });


  server.route({
    method: 'POST',
    path: '/admins/demote',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      validate: {
        payload: {
          username: Joi.string().lowercase().required()
        }
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root'),
        {
          assign: 'user',
          method: function (request, reply) {

            User.findByUsername(request.payload.username, (err, user) => {

              if (err) {
                return reply(err);
              }

              if (!user) {
                return reply(Boom.notFound('User document not found.'));
              }

              reply(user);
            });
          }
        }
      ]
    },
    handler: function (request, reply) {

      Async.auto({

        Admin: function (callback) {

          Admin.findByUsername(request.payload.username, callback);

        },
        removeUser: ['Admin', function (results,callback) {

          if(results.Admin) {

            const createRequest = {
              url: `/api/admins/${results.Admin._id}/user?id=${request.pre.user._id}`,
              method: 'DELETE',
              credentials: request.auth.credentials
            };

            server.inject(createRequest, (response) => {

              if(response.statusCode != 200) {
                return callback(response.result);
              }
              callback(null,response.result);
            });
          }
        }],
        deleteAdmin: ['removeUser', function (results,callback) {

          if(results.Admin) {
            Admin.findByIdAndDelete(results.Admin._id, callback);
          }
        }],
        unlinkUser: ['removeUser', function (results,callback) {

          if(results.Admin) {

            delete request.pre.user.roles.admin;

            User.findByIdAndUpdate(request.pre.user._id,request.pre.user, callback);
          }
        }]
      }, (err, result) => {

        if(err) {
          return reply(err);
        }
        reply({message:'Success'});
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/admins/{id}',
    config: {
      auth: {
        strategies: ['simple', 'session'],
        scope: 'admin'
      },
      pre: [
        AuthPlugin.preware.ensureAdminGroup('root')
      ]
    },
    handler: function (request, reply) {


      Admin.findByIdAndDelete(request.params.id, (err, admin) => {

        if (err) {
          return reply(err);
        }

        if (!admin) {
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
  name: 'admins'
};
