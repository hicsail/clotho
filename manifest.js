'use strict';
const Confidence = require('confidence');
const Config = require('./config');


const criteria = {
  env: process.env.NODE_ENV
};


const manifest = {
  $meta: 'This file defines the plot device.',
  server: {
    debug: {
      request: ['error']
    },
    connections: {
      routes: {
        security: true
      }
    }
  },
  connections: [{
    port: Config.get('/port/web'),
    labels: ['web']
  }],
  registrations: [
    {
      plugin: 'hapi-auth-basic'
    },
    {
      plugin: 'hapi-auth-cookie'
    },
    {
      plugin: 'lout'
    },
    {
      plugin: 'inert'
    },
    {
      plugin: 'vision'
    },
    {
      plugin: {
        register: 'visionary',
        options: {
          engines: {handlebars: 'handlebars'},
          path: './server/web/templates',
          layout: 'layout',
          layoutPath: './server/web/layouts',
          partialsPath: './server/web/partials',
          //helpersPath: './server/web/helpers',
        }
      }
    },
    {
      plugin: {
        register: 'hapi-mongo-models',
        options: {
          mongodb: Config.get('/hapiMongoModels/mongodb'),
          models: {
            Account: './server/models/account',
            AdminGroup: './server/models/admin-group',
            Admin: './server/models/admin',
            Annotation: './server/models/annotation',
            Assembly: './server/models/assembly',
            AuthAttempt: './server/models/auth-attempt',
            BioDesign: './server/models/bio-design',
            Container: './server/models/container',
            ExperimentDesign: './server/models/experiment-design',
            Experiment: './server/models/experiment',
            Feature: './server/models/feature',
            Influence: './server/models/influence',
            Medium: './server/models/medium',
            Module: './server/models/module',
            Parameter: './server/models/parameter',
            Part: './server/models/part',
            Role: './server/models/role',
            SampleData: './server/models/sample-data',
            Sample: './server/models/sample',
            Sequence: './server/models/sequence',
            Session: './server/models/session',
            User: './server/models/user'
          },
          autoIndex: Config.get('/hapiMongoModels/autoIndex')
        }
      }
    },
    {
      plugin: './server/auth'
    },
    {
      plugin: './server/mailer'
    },
    {
      plugin: './server/api/accounts',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/admin-groups',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/admins',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/annotations',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/assemblies',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/auth-attempts',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/bio-designs',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/contact',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/device',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/features',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/index',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/influences',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/login',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/logout',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/media',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/modules',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/parameters',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/parts',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/roles',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/sequences',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/sessions',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/signup',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/strains',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/subparts',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/users',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/clotho',
      options: {
        routes: {prefix: '/clotho'}
      }
    },
    {
      plugin: './server/api/functions',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/api/blast',
      options: {
        routes: {prefix: '/api'}
      }
    },
    {
      plugin: './server/web/index'
    },
    {
      plugin: './server/web/public'
    },
    {
      plugin: './server/web/documentation'
    },
    {
      plugin: './server/web/login/index'
    },
    {
      plugin: './server/web/signup/index'
    },
    {
      plugin: './server/web/account/index'
    }
  ]
};


const store = new Confidence.Store(manifest);


exports.get = function (key) {

  return store.get(key, criteria);
};


exports.meta = function (key) {

  return store.meta(key, criteria);
};
