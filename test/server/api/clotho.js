'use strict';
const Code = require('code');
const Config = require('../../../config');
const ClothoPlugin = require('../../../server/api/clotho');
const Hapi = require('hapi');
const Lab = require('lab');
const Package = require('../../../package');


const lab = exports.lab = Lab.script();
let request;
let server;


lab.beforeEach((done) => {

  const plugins = [ClothoPlugin];
  server = new Hapi.Server();
  server.connection({port: Config.get('/port/web')});
  server.register(plugins, (err) => {

    if (err) {
      return done(err);
    }

    server.initialize(done);
  });
});

lab.experiment('Clotho Plugin Version', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/version'
    };

    done();
  });


  lab.test('it returns a the correct version number', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.result.version).to.equal(Package.version);
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});

lab.experiment('Clotho Plugin Repository', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/repository'
    };

    done();
  });


  lab.test('it returns a the correct repository', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.result.repository).to.equal(Package.repository.url);
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});
