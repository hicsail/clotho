'use strict';
const AuthPlugin = require('../../../server/auth');
const AuthenticatedUser = require('../fixtures/credentials-admin');
const Code = require('code');
const Config = require('../../../config');
const FunctionsPlugin = require('../../../server/api/functions');
const Hapi = require('hapi');
const HapiAuthBasic = require('hapi-auth-basic');
const HapiAuthCookie = require('hapi-auth-cookie');
const Lab = require('lab');
const Manifest = require('../../../manifest');
const Proxyquire = require('proxyquire');

const lab = exports.lab = Lab.script();
let request;
let server;

lab.before((done) => {

  const proxy = {};
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

  const plugins = [HapiAuthBasic, HapiAuthCookie, ModelsPlugin, AuthPlugin, FunctionsPlugin];
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

lab.experiment('Function Plugin Check Type', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/checkType',
      payload: {
        sequence: 'ATGACCCTGAGAAGAGCACCG'
      },
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns the correct type based on the sequence', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.result.type).to.equal('dna');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});

lab.experiment('Function Plugin Reverse', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/reverse',
      payload: {
        sequence: 'ATGACCCTGAAGGTGAA'
      },
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns the correct type based on the sequence', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.result.sequence).to.equal('AAGTGGAAGTCCCAGTA');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});

lab.experiment('Function Plugin Complement', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/complement',
      payload: {
        sequence: 'ATGACCCTGAAGGTGAA'
      },
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns the correct type based on the sequence', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.result.sequence).to.equal('TACTGGGACTTCCACTT');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});

lab.experiment('Function Plugin Reverse Complement', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/reversecomplement',
      payload: {
        sequence: 'ATGACCCTGAAGGTGAA'
      },
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns the correct type based on the sequence', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.result.sequence).to.equal('TTCACCTTCAGGGTCAT');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});

lab.experiment('Function Plugin Reverse Complement', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/removeIntrons',
      payload: {
        sequence: 'ATGACCCTGAAGGTGAATGACAG',
        exons: [[1, 8]]
      },
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns the correct type based on the sequence', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.result.sequence).to.equal('TGACCCT');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});


lab.experiment('Function Plugin Reverse Complement', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/removeExons',
      payload: {
        sequence: 'ATGACCCTGAAGGTGAATGACAG',
        exons: [[1, 8]]
      },
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns the correct type based on the sequence', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.result.sequence).to.equal('AATGACA');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});


lab.experiment('Function Plugin Reverse Complement', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/transcribe',
      payload: {
        sequence: 'ATGACCCTGAAGGTGAA'
      },
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns the correct type based on the sequence', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.result.sequence).to.equal('AUGACCCUGAAGGUGAA');
      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});

lab.experiment('Function Plugin Languages', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/function/language',
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns languages', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});


lab.experiment('Function Plugin Versions', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'GET',
      url: '/function/version',
      credentials: AuthenticatedUser
    };

    done();
  });


  lab.test('it returns languages versions', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});

lab.experiment('Function Plugin Run', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/function/run',
      credentials: AuthenticatedUser,
      headers: { 'Content-Type': 'text/plain' },
      payload: 'node ["helloWorld"]\nvar inputs = process.argv[2].split(\',\');\nfor(var input of inputs) {\nconsole.log(input);\n}'
    };

    done();
  });


  lab.test('it returns an output of function', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });

  lab.test('it returns an error when there is not payload', (done) => {

    delete request.payload;

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(400);

      done();
    });
  });

  lab.test('it returns an error when payload is not valid', (done) => {

    request.payload = 'node "{testing:\'testing\'}"\nconsole.log();';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(400);

      done();
    });
  });

  lab.test('it returns an error when language is not valid', (done) => {

    request.payload = 'GREG ["helloWorld"]\nvar inputs = process.argv[2].split(\',\');\nfor(var input of inputs) {\nconsole.log(input);\n';

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(400);

      done();
    });
  });
});

lab.experiment('Function Plugin Create', () => {

  lab.beforeEach((done) => {

    request = {
      method: 'POST',
      url: '/function',
      credentials: AuthenticatedUser,
      payload: {
        name: 'myFunction',
        language: 'node',
        code: ['console.log(\'hello\')'],
        inputs: ['hello'],
        outputs: ['hello']
      }
    };

    done();
  });

  lab.test('it returns a function when create function is successful', (done) => {

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });

  lab.test('it returns an error when create function is fails', (done) => {

    request.payload.outputs = ['world'];

    server.inject(request, (response) => {

      Code.expect(response.statusCode).to.equal(200);

      done();
    });
  });
});
