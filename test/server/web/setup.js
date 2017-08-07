'use strict';
const AuthPlugin = require('../../../server/auth');
const AuthenticatedUser = require('../fixtures/credentials-admin');
const Code = require('code');
const Config = require('../../../config');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const Lab = require('lab');
const MakeMockModel = require('../fixtures/make-mock-model');
const Manifest = require('../../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const SetupPlugin = require('../../../server/web/setup/index');
const Vision = require('vision');
const Visionary = require('visionary');

const User = require('../../../server/models/user');
const Admin = require('../../../server/models/admin');
const AdminGroup = require('../../../server/models/admin-group');

const lab = exports.lab = Lab.script();
let request;
let server;
let stub;


lab.before((done) => {

  stub = {
    User: MakeMockModel()
  };

  const proxy = {};
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

  const plugins = [Vision, VisionaryPlugin, HapiAuthBasic, HapiAuthCookie, ModelsPlugin, AuthPlugin, SetupPlugin];
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

  User.deleteMany({}, (err, count) => {

    Admin.deleteMany({}, (err, count) => {

      AdminGroup.deleteMany({}, (err, count) => {

        server.plugins['hapi-mongo-models'].MongoModels.disconnect();
        done(err);
      });
    });
  });
});


lab.experiment('Setup Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/setup'
    };

    done();
  });


  lab.test('it renders properly', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusMessage).to.match(/Ok/i);
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });

  lab.test('it redirects when user is authenticated as an account', (done) => {

    request.credentials = AuthenticatedUser;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      done();
    });
  });

  lab.test('it return an error when finding root user fails', (done) => {

    User.findOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('findOne failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });
});

lab.experiment('Setup Post', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'post',
      url: '/setup',
      payload: {
        email: 'root@clotho.com',
        password: 'password'
      }
    };

    done();
  });


  lab.test('it redirects after successful post', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });

  lab.test('it returns an error if password fails to hash', (done) => {

    User.generatePasswordHash = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('password hash failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });
});
