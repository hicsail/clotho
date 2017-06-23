'use strict';
const AuthPlugin = require('../../../server/auth');
const AuthenticatedUser = require('../fixtures/credentials-admin');
const Code = require('code');
const Config = require('../../../config');
const FunctionsPlugin = require('../../../server/api/functions');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const Lab = require('lab');
const Manifest = require('../../../manifest');
const Proxyquire = require('proxyquire');


const lab = exports.lab = Lab.script();
let request;
let server;

lab.before((done) => {

  const proxy = {};
  const ModelsPlugin = {
    register: Proxyquire('hapi-mongo-models', proxy),
    options: Manifest.get('/registrations').filter((reg) => {

      if (reg.plugin &&
        reg.plugin.register &&
        reg.plugin.register === 'hapi-mongo-models') {

        return true;
      }

      return false;
    })[0].plugin.options
  };

  const plugins = [HapiAuthBasic, HapiAuthCookie, ModelsPlugin, AuthPlugin, FunctionsPlugin];
  server = new Hapi.Server();
  server.connection({port: Config.get('/port/web')});
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});


lab.after((done) => {

  server.plugins['hapi-mongo-models'].MongoModels.disconnect();

  done();
});

lab.experiment('Function Plugin Check Type', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/checkType',
      payload: {
        sequence: 'ATGACCCTGAGAAGAGCACCG'
      },
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns the correct type based on the sequence', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.result.type).to.equal('dna');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});

lab.experiment('Function Plugin Reverse', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/reverse',
      payload: {
        sequence: 'ATGACCCTGAAGGTGAA'
      },
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns the correct type based on the sequence', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.result.sequence).to.equal('AAGTGGAAGTCCCAGTA');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});

lab.experiment('Function Plugin Complement', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/complement',
      payload: {
        sequence: 'ATGACCCTGAAGGTGAA'
      },
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns the correct type based on the sequence', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.result.sequence).to.equal('TACTGGGACTTCCACTT');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});

lab.experiment('Function Plugin Reverse Complement', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/reversecomplement',
      payload: {
        sequence: 'ATGACCCTGAAGGTGAA'
      },
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns the correct type based on the sequence', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.result.sequence).to.equal('TACTGGGACTTCCACTT');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});
