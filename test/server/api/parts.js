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
const PartPlugin = require('../../../server/api/parts');

const lab = exports.lab = Lab.script();
let request;
let server;
let stub;


lab.before((done) => {

  stub = {
    Part: MakeMockModel(),
    Device: MakeMockModel(),
    BioDesign: MakeMockModel(),
    Parameter: MakeMockModel(),
    Module: MakeMockModel(),
    Assembly: MakeMockModel(),
    Sequence: MakeMockModel(),
    Annotation: MakeMockModel(),
    Feature: MakeMockModel(),
  };

  const proxy = {};
  proxy[Path.join(process.cwd(), './server/models/device')] = stub.Device;

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

  const plugins = [HapiAuthBasic, ModelsPlugin, AuthPlugin, PartPlugin];
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

lab.experiment('Influences Plugin Update', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'PUT',
      url: '/part',
      payload: {
        sort: '_id',
        limit: 20,
        page: 1,
        name: 'Test name',
        displayId: 'Test display id',
        role: 'Test role',
        sequence: 'Test sequence',
        parameters: [{
          name: 'Test name',
          units: 'Test units',
          value: 10,
          variable: 'Test variable'
        }]
      },
      credentials: AuthenticatedUser
    };

    done();
  });

  //TODO: Put the tests for PUT here.

});

// lab.experiment('Part Plugin Read', () => {
//
//   lab.beforeEach((done) => {
//
//     request = {
//       method: 'GET',
//       url: '/part/42000000000',
//       credentials: AuthenticatedUser
//     };
//
//     done();
//   });
//
//   lab.test('it returns an error when find by id fails', (done) => {
//
//     stub.Part.findById = function (id, callback) {
//
//       callback(Error('find by id failed'));
//     };
//
//     server.inject(request, (response) => {
//
//       Code.expect(response.statusCode).to.equal(500);
//
//       done();
//     });
//   });
//
//   lab.test('it returns a not found when find by id misses', (done) => {
//
//     stub.Part.findById = function (id, callback) {
//
//       callback();
//     };
//
//     server.inject(request, (response) => {
//
//       Code.expect(response.statusCode).to.equal(404);
//       Code.expect(response.result.message).to.match(/document not found/i);
//
//       done();
//     });
//   });
//
//   lab.test('it returns a document successfully', (done) => {
//
//     stub.Part.findById = function (id, callback) {
//
//       callback(null, {});
//     };
//
//     server.inject(request, (response) => {
//
//       Code.expect(response.statusCode).to.equal(200);
//       Code.expect(response.result).to.be.an.object();
//
//       done();
//     });
//   });
// });

lab.experiment('Part Plugin Create', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/part',
      payload: {
        name: 'ibs',
        displayId: 'test display id',
        role: 'test role',
        parameters: null,
        sequence: 'test sequence'
      },
      credentials: AuthenticatedUser
    };

    done();
  });

  //TODO: Tests go here
});

// lab.experiment('Part Plugin Delete', () => {
//
//   lab.beforeEach((done) => {
//
//     request = {
//       method: 'DELETE',
//       url: '/part/42000000000',
//       credentials: AuthenticatedUser
//     };
//
//     done();
//   });
//
//   lab.test('it returns an error when delete by id fails', (done) => {
//
//     stub.Part.findByIdAndDelete = function (id, callback) {
//
//       callback(Error('delete by id failed'));
//     };
//
//     server.inject(request, (response) => {
//
//       Code.expect(response.statusCode).to.equal(500);
//
//       done();
//     });
//   });
//
//   lab.test('it returns a not found when delete by id misses', (done) => {
//
//     stub.Part.findByIdAndDelete = function (id, callback) {
//
//       callback(null, undefined);
//     };
//
//     sever.inject(request, (response) => {
//
//       Code.expect(response.statusCode).to.equal(404);
//       Code.expect(response.result.message).to.match(/document not found/i);
//
//       done();
//     });
//   });
//
//   lab.test('it deletes a document successfully', (done) => {
//
//     stub.Part.findByIdAndDelete = function (id, callback) {
//
//       callback(null, 1);
//     };
//
//     server.inject(request, (response) => {
//
//       Code.expect(response.statusCode).to.equal(200);
//       Code.expect(response.result.message).to.match(/success/i);
//
//       done();
//     });
//   });
// });
