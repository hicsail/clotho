'use strict';
const AuthPlugin = require('../../../server/auth');
const Code = require('code');
const Config = require('../../../config');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const SignupPlugin = require('../../../server/web/signup/index');
const Lab = require('lab');
const MakeMockModel = require('../fixtures/make-mock-model');
const Manifest = require('../../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const Vision = require('vision');
const Visionary = require('visionary');

let stub;

stub = {
  Account: MakeMockModel(),
  Session: MakeMockModel(),
  User: MakeMockModel()
};

const proxy = {};
proxy[Path.join(process.cwd(), './server/models/account')] = stub.Account;
proxy[Path.join(process.cwd(), './server/models/session')] = stub.Session;
proxy[Path.join(process.cwd(), './server/models/user')] = stub.User;

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
const lab = exports.lab = Lab.script();
let request;
let server;


lab.beforeEach((done) => {

  const plugins = [Vision, VisionaryPlugin, ModelsPlugin, SignupPlugin, AuthPlugin, HapiAuthCookie, HapiAuthBasic];
  server = new Hapi.Server();
  server.connection({ port: Config.get('/port/web') });
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});


lab.experiment('Sign up Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/register'
    };

    done();
  });



  lab.test('register page renders properly', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusMessage).to.match(/OK/i);
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});
