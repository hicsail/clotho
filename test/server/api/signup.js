'use strict';
const AuthPlugin = require('../../../server/auth');
const Code = require('code');
const Config = require('../../../config');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const Lab = require('lab');
const MailerPlugin = require('../../../server/mailer');
const MakeMockModel = require('../fixtures/make-mock-model');
const Manifest = require('../../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const SignupPlugin = require('../../../server/api/signup');


const lab = exports.lab = Lab.script();
let request;
let server;
let stub;


lab.before((done) => {

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

  const plugins = [HapiAuthBasic, HapiAuthCookie, AuthPlugin, ModelsPlugin, MailerPlugin, SignupPlugin];
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

lab.experiment('Signup Plugin Password Check', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/signup',
      payload: {
        name: 'Muddy Mudskipper',
        username: 'muddy',
        email: 'mrmud@mudmail.mud',
        application: 'Web 1'
      }
    };

    done();
  });

  lab.test('it returns an error when password is too short', (done) => {

    request.payload.password = 'test';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(400);

      done();
    });
  });

  lab.test('it returns an error when password is too long', (done) => {

    request.payload.password = 'KnAshbUDNBVaekNJquALBQVTMMutRszua';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(400);

      done();
    });
  });

  lab.test('it returns an error when password dose not contain lowercase letter', (done) => {

    request.payload.password = 'ABCDEFGHIJK';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(400);

      done();
    });
  });

  lab.test('it returns an error when password dose not contain uppercase letter', (done) => {

    request.payload.password = 'abcdefghijk';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(400);

      done();
    });
  });

  lab.test('it returns an error when password dose not contain a number', (done) => {

    request.payload.password = 'abcdefghijK';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(400);

      done();
    });
  });
});

lab.experiment('Signup Plugin', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/signup',
      payload: {
        name: 'Muddy Mudskipper',
        username: 'muddy',
        password: 'dirtandWater1',
        email: 'mrmud@mudmail.mud',
        application: 'Web 1'
      }
    };

    done();
  });

  lab.test('it returns an error when find one fails for username check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.username) {
        callback(Error('find one failed'));
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a conflict when find one hits for username check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.username) {
        callback(null, {});
      }
      else {
        callback(Error('find one failed'));
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });


  lab.test('it returns an error when find one fails for email check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.email) {
        callback(Error('find one failed'));
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a conflict when find one hits for email check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.email) {
        callback(null, {});
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(409);

      done();
    });
  });


  lab.test('it returns an error if any critical setup step fails', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.create = function (username, password, email, name, callback) {

      callback(Error('create failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it finishes successfully (even if sending welcome email fails)', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.create = function (username, password, email, name, callback) {

      callback(null, {_id: 'BL4M0'});
    };

    stub.Account.create = function (name, callback) {

      const account = {
        _id: 'BL4M0',
        name: {
          first: 'Muddy',
          last: 'Mudskipper'
        }
      };

      callback(null, account);
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, [{}, {}]);
    };

    stub.Account.findByIdAndUpdate = function (id, update, callback) {

      callback(null, [{}, {}]);
    };

    const realSendEmail = server.plugins.mailer.sendEmail;
    server.plugins.mailer.sendEmail = function (options, template, context, callback) {

      callback(new Error('Whoops.'));
    };

    stub.Session.create = function (username, application, callback) {

      callback(null, {});
    };

    const realWarn = console.warn;
    console.warn = function () {

      console.warn = realWarn;

      done();
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      server.plugins.mailer.sendEmail = realSendEmail;
    });
  });


  lab.test('it finishes successfully', (done) => {

    stub.User.findOne = function (conditions, callback) {

      callback();
    };

    stub.User.create = function (username, password, email, name, callback) {

      callback(null, {_id: 'BL4M0'});
    };

    stub.Account.create = function (name, callback) {

      const account = {
        _id: 'BL4M0',
        name: {
          first: 'Muddy',
          last: 'Mudskipper'
        }
      };

      callback(null, account);
    };

    stub.User.findByIdAndUpdate = function (id, update, callback) {

      callback(null, [{}, {}]);
    };

    stub.Account.findByIdAndUpdate = function (id, update, callback) {

      callback(null, [{}, {}]);
    };

    const realSendEmail = server.plugins.mailer.sendEmail;
    server.plugins.mailer.sendEmail = function (options, template, context, callback) {

      callback(null, {});
    };

    stub.Session.create = function (username, application, callback) {

      callback(null, {});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      server.plugins.mailer.sendEmail = realSendEmail;

      done();
    });
  });
});

lab.experiment('Available Plugin', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/available',
      payload: {
        username: 'muddy',
        email: 'mrmud@mudmail.mud'
      }
    };

    done();
  });

  lab.test('it returns an error when find one fails for username check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.username) {
        callback(Error('find one failed'));
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a not available when find one hits for username check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.username) {
        callback(null, {});
      }
      else {
        callback(null, {});
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.result.username.status).to.equal('taken');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });


  lab.test('it returns an error when find one fails for email check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.email) {
        callback(Error('find one failed'));
      }
      else {
        callback();
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns not available when find one hits for email check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.email) {
        callback(null, {});
      }
      else {
        callback(null, {});
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.result.email.status).to.equal('taken');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});

lab.experiment('Available Plugin', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/available',
      payload: {}
    };

    done();
  });

  lab.test('it returns an error with invaild input', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(400);

      done();
    });
  });
});

lab.experiment('Available Plugin', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/available',
      payload: {
        email: 'myemail@email.com'
      }
    };

    done();
  });

  lab.test('it returns not available when find one hits for email check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.email) {
        callback(null, null);
      }
      else {
        callback(null, null);
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.result.email.status).to.equal('available');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});

lab.experiment('Available Plugin', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/available',
      payload: {
        username: 'myusername'
      }
    };

    done();
  });

  lab.test('it returns available when find one hits for email check', (done) => {

    stub.User.findOne = function (conditions, callback) {

      if (conditions.username) {
        callback(null, null);
      }
      else {
        callback(null, null);
      }
    };

    server.inject(request, (response) => {

      Code.expect(response.result.username.status).to.equal('available');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});
