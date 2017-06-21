// 'use strict';
// const AuthPlugin = require('../../../server/auth');
// const AuthenticatedUser = require('../fixtures/credentials-admin');
// const Code = require('code');
// const Config = require('../../../config');
// const Hapi = require('hapi');
// const HapiAuthBasic = require('hapi-auth-basic');
// const Lab = require('lab');
// const MakeMockModel = require('../fixtures/make-mock-model');
// const Manifest = require('../../../manifest');
// const Path = require('path');
// const Proxyquire = require('proxyquire');
// const StrainPlugin = require('../../../server/api/strains');
//
// const lab = exports.lab = Lab.script();
// let request;
// let server;
// let stub;
//
//
// lab.before((done) => {
//
//   stub = {
//     Strain: MakeMockModel()
//   };
//
//   const proxy = {};
//   proxy[Path.join(process.cwd(), './server/models/strain')] = stub.Strain;
//
//   const ModelsPlugin = {
//     register: Proxyquire('hapi-mongo-models', proxy),
//     options: Manifest.get('/registrations').filter((reg) => {
//
//       if (reg.plugin &&
//         reg.plugin.register &&
//         reg.plugin.register === 'hapi-mongo-models') {
//
//         return true;
//       }
//
//       return false;
//     })[0].plugin.options
//   };
//
//   const plugins = [HapiAuthBasic, ModelsPlugin, AuthPlugin, StrainPlugin];
//   server = new Hapi.Server();
//   server.connection({port: Config.get('/port/web')});
//   server.register(plugins, (err) => {
//
//     if (err) {
//       return done(err);
//     }
//
//     server.initialize(done);
//   });
// });
//
//
// lab.after((done) => {
//
//   server.plugins['hapi-mongo-models'].MongoModels.disconnect();
//
//   done();
// });
//
//
//
// lab.experiment('Strain Plugin Update', () => {
//
//   lab.beforeEach((done) => {
//
//     request = {
//       method: 'PUT',
//       url: '/strain/420000000000000000000000',
//       payload: {
//         name: 'ibs',
//         description: 'This is a test description'
//       },
//       credentials: AuthenticatedUser
//     };
//
//     done();
//   });
//
//   lab.test('it updates the document successfully', (done) => {
//
//     stub.Strain.findByIdAndUpdate = function (id, update, callback) {
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
//
//   lab.test('it returns an error', (done) => {
//
//     stub.Strain.findByIdAndUpdate = function (id, update, callback) {
//
//       callback(Error('error'));
//     };
//
//     server.inject(request, (response) => {
//
//       Code.expect(response.statusCode).to.equal(500);
//       done();
//     });
//   });
//
//   lab.test('the bio design is not found', (done) => {
//
//     stub.Strain.findByIdAndUpdate = function (id, update, callback) {
//
//       callback(null, null);
//     };
//
//     server.inject(request, (response) => {
//
//       Code.expect(response.statusCode).to.equal(404);
//       done();
//     });
//   });
//
// });
