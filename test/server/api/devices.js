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
const DevicePlugin = require('../../../server/api/device');

const lab = exports.lab = Lab.script();
let request;
let server;
let stub;


lab.before((done) => {

  stub = {
    Device: MakeMockModel(),
    BioDesign: MakeMockModel(),
    Parameter: MakeMockModel(),
    Module: MakeMockModel(),
    Part: MakeMockModel(),
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

  const plugins = [HapiAuthBasic, ModelsPlugin, AuthPlugin, DevicePlugin];
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


// lab.experiment('Device Plugin Result List', () => {
//
//   lab.beforeEach((done) => {
//
//     request = {
//       method: 'GET',
//       url: '/device',
//       credentials: AuthenticatedUser
//     };
//
//     done();
//   });
//
//   lab.test('it returns an error when paged find fails', (done) => {
//
//     stub.Device.pagedFind = function () {
//       const args = Array.prototype.slice.call(arguments);
//       const callback = args.pop();
//
//       callback(Error('find failed'));
//     };
//     server.inject(request, (response) => {
//
//       Code.expect(response.statusCode).to.equal(500);
//
//       done();
//     });
//   });
//
//   lab.test('it returns an array of documents successfully', (done) => {
//
//     stub.Device.pagedFind = function () {
//
//       const args = Array.prototype.slice.call(arguments);
//       const callback = args.pop();
//
//       callback(null, {data: [{}, {}, {}]});
//     };
//
//     server.inject(request, (response) => {
//
//       Code.expect(response.statusCode).to.equal(200);
//       Code.expect(response.result.data).to.be.an.array();
//       Code.expect(response.result.data[0]).to.be.an.object();
//
//       done();
//     });
//   });
// });
//
// lab.experiment('Device Plugin Read', () => {
//
//   lab.beforeEach((done) => {
//
//     request = {
//       method: 'GET',
//       url: '/device/42000000000',
//       credentials: AuthenticatedUser
//     };
//
//     done();
//   });
//
//   lab.test('it returns an error when find by id fails', (done) => {
//
//     stub.Device.findById = function (id, callback) {
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
//     stub.Device.findById = function (id, callback) {
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
//     stub.Device.findById = function (id, callback) {
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


lab.experiment('Device Plugin Create', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/device',
      payload: {
        name: 'ibs',
        userId: 'Test user id',
        displayId: 'Test display id',
        role: 'Test role',
        partIds: ['test', 'array'],
        createSeqFromParts: true,
        sequence: 'Test sequence',
        parameters: []
      },
      credentials: AuthenticatedUser
    };

    done();
  });

  lab.test('Create BioDesign Fails', (done) => {
    stub.BioDesign
  })

})
