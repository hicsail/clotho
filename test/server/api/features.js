'use strict';
const AuthPlugin = require('../../../server/auth');
const AuthenticatedUser = require('../fixtures/credentials-admin');
const Code = require('code');
const Config = require('../../../config');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const Lab = require('lab');
const MakeMockModel = require('../fixtures/make-mock-model');
const Manifest = require('../../../manifest');
const Path = require('path');
const Proxyquire = require('proxyquire');
const FeaturePlugin = require('../../../server/api/features');

const lab = exports.lab = Lab.script();
let request;
let server;
let stub;


lab.before((done) => {

  stub = {
    Feature: MakeMockModel()
  };

  const proxy = {};
  proxy[Path.join(process.cwd(), './server/models/feature')] = stub.Feature;

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

  const plugins = [HapiAuthBasic, ModelsPlugin, AuthPlugin, FeaturePlugin];
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


lab.experiment('Feature Plugin Result List', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/feature',
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns an error when paged find fails', (done) => {

    stub.Feature.pagedFind = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('find failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns an array of documents successfully', (done) => {

    stub.Feature.pagedFind = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(null, {data: [{}, {}, {}]});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.data).to.be.an.array();
      Code.expect(response.result.data[0]).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Feature Plugin Read', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/feature/93EP150D35',
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns an error when find by id fails', (done) => {

    stub.Feature.findById = function (id, callback) {

      callback(Error('find by id failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a not found when find by id misses', (done) => {

    stub.Feature.findById = function (id, callback) {

      callback();
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);
      Code.expect(response.result.message).to.match(/document not found/i);

      done();
    });
  });


  lab.test('it returns a document successfully', (done) => {

    stub.Feature.findById = function (id, callback) {

      callback(null, {_id: '93EP150D35'});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});


lab.experiment('Feature Plugin Delete', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'DELETE',
      url: '/feature/93EP150D35',
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns an error when delete by id fails', (done) => {

    stub.Feature.findByIdAndDelete = function (id, callback) {

      callback(Error('delete by id failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });


  lab.test('it returns a not found when delete by id misses', (done) => {

    stub.Feature.findByIdAndDelete = function (id, callback) {

      callback(null, undefined);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);
      Code.expect(response.result.message).to.match(/document not found/i);

      done();
    });
  });


  lab.test('it deletes a document successfully', (done) => {

    stub.Feature.findByIdAndDelete = function (id, callback) {

      callback(null, 1);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result.message).to.match(/success/i);

      done();
    });
  });
});

lab.experiment('Feature Plugin Create', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/feature',
      payload: {
        name: 'sequence1',
        annotationId: 'annotationId',
        role: 'role'
      },
      credentials: AuthenticatedUser
    };

    done();
  });

  lab.test('it returns an error when create fails', (done) => {

    stub.Feature.findOne = function (conditions, callback) {

      callback();
    };

    stub.Feature.create = function (name, description, userId, displayId, role, annotationId, moduleId, callback) {

      callback(Error('create failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it creates a document successfully', (done) => {

    stub.Feature.findOne = function (conditions, callback) {

      callback();
    };

    stub.Feature.create = function (name, description, userId, displayId, role, annotationId, moduleId, callback) {

      callback(null, {});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });
});

lab.experiment('Features Plugin Update', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'PUT',
      url: '/feature/420000000000000000000000',
      payload: {
        name: 'ibs',
        displayId: 'Test display id',
        description: 'Test description',
        role: 'Test role',
        annotationId: 'Test annotation id',
        moduleId: 'Test module id'
      },
      credentials: AuthenticatedUser
    };
    done();
  });

  lab.test('it updates the document successfully', (done) => {

    stub.Feature.findByIdAndUpdate = function (id, update, callback) {

      callback(null, {});
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.object();

      done();
    });
  });

  lab.test('it returns an error', (done) => {

    stub.Feature.findByIdAndUpdate = function (id, update, callback) {

      callback(Error('error'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);
      done();
    });
  });

  lab.test('the feature is not found', (done) => {

    stub.Feature.findByIdAndUpdate = function (id, update, callback) {

      callback(null, null);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);
      done();
    });
  });

});
