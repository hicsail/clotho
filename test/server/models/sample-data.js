'use strict';
const SampleData = require('../../../server/models/sample-data');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('SampleData Class Methods', () => {

  lab.before((done) => {

    SampleData.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    SampleData.deleteMany({}, (err, count) => {

      SampleData.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    SampleData.create(
      'sampleData',
      'sampleData description',
      'userid12test',
      'sampleId',
      'responseVariables',
      'instrument',
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(SampleData);

      done();
    });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = SampleData.insertOne;
    SampleData.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    SampleData.create(
      'sampleData',
      'sampleData description',
      'userid12test',
      'sampleId',
      'responseVariables',
      'instrument',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      SampleData.insertOne = realInsertOne;

      done();
    });
  });
});
