'use strict';
const AuthPlugin = require('../../../server/auth');
const AuthenticatedAccount = require('../fixtures/credentials-account');
const Code = require('code');
const Config = require('../../../config');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const MakeMockModel = require('../fixtures/make-mock-model');
const Lab = require('lab');
const LoginPlugin = require('../../../server/web/login/index');
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

  const plugins = [Vision, VisionaryPlugin, HapiAuthBasic, HapiAuthCookie, ModelsPlugin, AuthPlugin, LoginPlugin];
  server = new Hapi.Server();
  server.connection({ port: Config.get('/port/web') });
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});


lab.experiment('Login Page View', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/login'
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

    request.credentials = AuthenticatedAccount;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);
      done();
    });
  });

  lab.test('it redirects when user is authenticated as an account to url', (done) => {

    request.credentials = AuthenticatedAccount;
    request.url = '/login?returnUrl=/account';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);
      done();
    });
  });
});

lab.experiment('Logout Plugin', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/logout'
    };

    done();
  });


  lab.test('it redirect user if no user is logged in', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });

  lab.test('it loggout out user and bring them to home page', (done) => {

    request.credentials = AuthenticatedAccount;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });

  lab.test('it returns error when loggout out fails', (done) => {

    request.credentials = AuthenticatedAccount;

    stub.Session.findByIdAndDelete = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('paged find failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });
});

lab.experiment('Forgot Plugin', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/forgot'
    };

    done();
  });

  lab.test('page loads succfully', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });


  lab.test('it redirect user if user is logged in', (done) => {

    request.credentials = AuthenticatedAccount;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });
});


lab.experiment('Reset Plugin', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/reset'
    };

    done();
  });

  lab.test('page loads succfully', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });


  lab.test('it redirect user if user is logged in', (done) => {

    request.credentials = AuthenticatedAccount;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(302);

      done();
    });
  });
});
