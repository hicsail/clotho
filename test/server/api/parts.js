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
const PartPlugin = require('../../../server/api/parts');

const lab = exports.lab = Lab.script();
let request;
let server;
let stub;


lab.before((done) => {

  stub = {
    Part: MakeMockModel(),
    BioDesign: MakeMockModel(),
    Parameter: MakeMockModel(),
    Module: MakeMockModel(),
    Assembly: MakeMockModel(),
    Sequence: MakeMockModel(),
    Annotation: MakeMockModel(),
    Feature: MakeMockModel(),
    Role: MakeMockModel()
  };

  const proxy = {};
  proxy[Path.join(process.cwd(), './server/models/part')] = stub.Part;
  proxy[Path.join(process.cwd(), './server/models/bio-design')] = stub.BioDesign;

  const ModelsPlugin = {
    register: Proxyquire('hapi-mongo-models', proxy),
    options: Manifest.get('/registrations').filter((reg) => {

      if (reg.plugin && reg.plugin.register && reg.plugin.register === 'hapi-mongo-models') {

        return true;
      }

      return false;
    })[0].plugin.options
  };

  const plugins = [HapiAuthBasic, HapiAuthCookie, ModelsPlugin, AuthPlugin, PartPlugin];
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

lab.experiment('Parts Plugin Update', () => {

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
        sequence: 'ACT',
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


// Update using ID.
lab.experiment('Parts Plugin by Id Update', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'PUT',
      url: '/part/update/5952967356dc2954e85b4095',
      payload: {
        sort: '_id',
        limit: 20,
        page: 1,
        name: 'Test name',
        displayId: 'Test display id',
        role: 'Test role',
        sequence: 'ACT',
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

});

// GET Tests
lab.experiment('Part Plugin Read', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/part/5952967356dc2954e85b4095',
      credentials: AuthenticatedUser
    };

    done();
  });

  lab.test('it returns an error when get BioDesignsId fails', (done) => {

    stub.BioDesign.getBioDesignIds = function (id, query, isDevice, callback) {

      callback(Error('find id failed'));
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(500);

      done();
    });
  });

  lab.test('it returns a not found error when find by id misses', (done) => {

    stub.BioDesign.getBioDesignIds = function (id, query, isDevice, callback) {

      callback(null, []);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(404);
      Code.expect(response.result.message).to.match(/Document not found./i);


      done();
    });
  });

  lab.test('it returns a document successfully', (done) => {

    stub.BioDesign.getBioDesignIds = function (id, query, isDevice, callback) {

      callback(null, [{_id: '5952967356dc2954e85b4095'}]);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.an.array();

      done();
    });
  });
});

lab.experiment('Part Plugin Create', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/part',
      payload: {
        name: 'ibs',
        displayId: 'test display id',
        role: 'PROMOTER',
        parameters: [
          {
            'name': 'paramName',
            'value': 25,
            'variable': 'y',
            'units': 'mg'
          }
        ],
        sequence: 'ATGATG'
      },
      credentials: AuthenticatedUser
    };

    done();
  });

  lab.test('parameters is undefined', (done) => {

    delete request.payload.parameters;

    stub.Role.checkValidRole = function (role, callback) {
      return callback(true);
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.a.string();

      done();
    });
  });


  lab.test('parameters is not undefined', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.a.string();

      done();
    });
  });


  lab.test('role is undefined', (done) => {

    delete request.payload.role;

    stub.Role.checkValidRole = function (role, callback) {
      return true;
    };

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.a.string();

      done();
    });
  });


  lab.test('role is not undefined', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);
      Code.expect(response.result).to.be.a.string();

      done();
    });
  });


});

lab.experiment('Part Plugin Create with multiple parameters', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/part',
      payload: {
        name: 'ibs',
        displayId: 'test display id',
        role: 'PROMOTER',
        parameters: [
          {
            'name': 'paramName',
            'value': 25,
            'variable': 'y',
            'units': 'mg'
          },
          {
            'name': 'param2',
            'value': 40,
            'variable': 'x',
            'units': 'mV'
          }
        ],
        sequence: 'ATGATG'
      },
      credentials: AuthenticatedUser
    };

    done();
  });


});


//   //TODO: Tests go here
//


//
//   lab.test('part is created successfully', (done) => {
//
//     // request = {
//     //   name: name,
//     //   description: description,
//     //   userId: userId,
//     //   displayId: displayId,
//     //   bioDesignId: bioDesignId
//     // }
//     stub.Part.create = function (name, description, userId, displayId, bioDesignId, callback) {
//
//       callback(null, {});
//     };
//
//     server.inject(request, (response) => {
//
//       Code.expect(response.statusCode).to.equal(200);
//       Code.expect(response.result).to.be.a.string();
//
//       done();
//     });
//   });
//
//   lab.test('part creation returns an error', (done) => {
//
//     stub.Part.create = function (name, description, userId, displayId, bioDesignId, callback) {
//
//       callback(Error('create failed'));
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
//   lab.test('sequence is undefined', (done) => {
//
//     delete request.payload.sequence;
//
//     server.inject(request, (response) => {
//
//       Code.expect(response.statusCode).to.equal(200);
//       Code.expect(response.result).to.be.a.string();
//
//       done();
//     });
//   });
//
//   lab.test('sequence is not undefined', (done) => {
//
//     server.inject(request, (response) => {
//
//       Code.expect(response.statusCode).to.equal(200);
//       Code.expect(response.result).to.be.a.string();
//
//       done();
//     });
//   });
//
//
//   // lab.test('part is created successfully', (done) => {
//   //
//   //   server.inject(request, (response) => {
//   //
//   //     Code.expect(response.statusCode).to.equal(200);
//   //     Code.expect(response.result).to.be.a.string();
//   //
//   //     done();
//   //   });
//   // });
//
// });

// lab.experiment('Part Plugin Delete', () => {
//
//   lab.beforeEach((done) => {
//
//     request = {
//       method: 'DELETE',
//       url: '/part/59515202d8ba1948a9e187e4',
//       credentials: AuthenticatedUser
//     };
//
//     done();
//   });
//
//   lab.test('it returns an error when delete by id fails', (done) => {
//
//     stub.BioDesign.findByIdAndDelete = function (id, callback) {
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
//     stub.BioDesign.findByIdAndDelete = function (id, callback) {
//
//       callback(null, undefined);
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
//   lab.test('it deletes a document successfully', (done) => {
//
//     stub.BioDesign.findByIdAndDelete = function () {
//
//       callback({message: 'Success.'});
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
