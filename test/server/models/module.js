'use strict';
const Module = require('../../../server/models/module');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('Module Class Methods', () => {

  lab.before((done) => {

    Module.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Module.deleteMany({}, (err, count) => {

      Module.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Module.create(
      'module',
      'module description',
      'TRANSCRIPTION',
      'features',
      'submodule',
      'userid12test',
      'displayId',
      'bioDesignId',
      (err, result) => {

        Code.expect(err).to.not.exist();
        Code.expect(result).to.be.an.instanceOf(Module);

        done();
      });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Module.insertOne;
    Module.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Module.create(
      'module',
      'module description',
      'TRANSCRIPTION',
      'features',
      'submodule',
      'userid12test',
      'displayId',
      'bioDesignId',
      (err, result) => {

        Code.expect(err).to.be.an.object();
        Code.expect(result).to.not.exist();

        Module.insertOne = realInsertOne;

        done();
      });
  });
});
