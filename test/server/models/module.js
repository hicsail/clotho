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
      'userid12test',
      'displayId',
      'bioDesignId',
      'TRANSCRIPTION',
      'features',
      'submodule',
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
      'userid12test',
      'displayId',
      'bioDesignId',
      'TRANSCRIPTION',
      'features',
      'submodule',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Module.insertOne = realInsertOne;

      done();
    });
  });

  lab.test('it returns an instance when findByBioDesignId succeeds', (done) => {

    Module.findByBioDesignId(
    ['bioDesignId'],
    null,
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result[0]).to.be.an.instanceOf(Module);

      done();
    });
  });

  lab.test('it returns an error when findByBioDesignId fails', (done) => {

    const realFunction = Module.find;
    Module.find = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('failed'));
    };

    Module.findByBioDesignId(
    ['bioDesignId'],
    null,
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Module.find = realFunction;

      done();
    });
  });
});
