'use strict';
const AuthPlugin = require('../../../server/auth');
const AuthenticatedAccount = require('../fixtures/credentials-account');
const AuthenticatedAdmin = require('../fixtures/credentials-admin');
const Code = require('code');
const Config = require('../../../config');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const MakeMockModel = require('../fixtures/make-mock-model');
const Lab = require('lab');
const AdminPlugin = require('../../../server/web/admin');
const Manifest = require('../../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const Vision = require('vision');
const Visionary = require('visionary');

let stub;

stub = {
  Session: MakeMockModel()
};

const proxy = {};
proxy[Path.join(process.cwd(), './server/models/session')] = stub.Session;

const lab = exports.lab = Lab.script();
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

const VisionaryPlugin = {
  register: Visionary,
  options: Manifest.get('/registrations').filter((reg) => {

    if (reg.plugin && reg.plugin.register && reg.plugin.register === 'visionary') {

      return true;
    }

    return false;
  })[0].plugin.options
};


let request;
let server;


lab.before((done) => {

  const plugins = [Vision, VisionaryPlugin, HapiAuthBasic, HapiAuthCookie, ModelsPlugin, AuthPlugin, AdminPlugin];
  server = new Hapi.Server();
  server.connection({port: Config.get('/port/web')});
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});


lab.experiment('Admin Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/admin'
    };

    done();
  });


  lab.test('it redirects when no user is logged in', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });

  lab.test('it returns you with an error when not an admin', (done) => {

    request.credentials = AuthenticatedAccount;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(403);
      done();
    });
  });

  lab.test('it redirects when user is authenticated admin', (done) => {

    request.credentials = AuthenticatedAdmin;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      done();
    });
  });
});
