'use strict';
const Sample = require('../../../server/models/sample');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('Sample Class Methods', () => {

  lab.before((done) => {

    Sample.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Sample.deleteMany({}, (err, count) => {

      Sample.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Sample.create(
      'name',
      'description',
      'userId',
      'containerId',
      'bioDesignId',
      'parameterIds',
      'parentSampleIds',
      (err, result) => {

        Code.expect(err).to.not.exist();
        Code.expect(result).to.be.an.instanceOf(Sample);

        done();
      });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Sample.insertOne;
    Sample.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Sample.create(
      'name',
      'description',
      'userId',
      'containerId',
      'bioDesignId',
      'parameterIds',
      'parentSampleIds',
      (err, result) => {

        Code.expect(err).to.be.an.object();
        Code.expect(result).to.not.exist();

        Sample.insertOne = realInsertOne;

        done();
      });
  });
});
