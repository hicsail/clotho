'use strict';
const Annotation = require('../../../server/models/annotation');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const TestAnnotations = require('../testData/annotations');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('Annotation Class Methods', () => {

  lab.before((done) => {

    Annotation.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });

  lab.after((done) => {

    Annotation.deleteMany({}, (err, count) => {

      Annotation.disconnect();

      done(err);
    });
  });

  lab.test('it returns a new instance when create succeeds', (done) => {

    let testCase = 0;

    Annotation.create(
      'sequenceId',
      TestAnnotations[testCase].name,
      TestAnnotations[testCase].description,
      TestAnnotations[testCase].start,
      TestAnnotations[testCase].end,
      TestAnnotations[testCase].isForwardStrand,
      'userid12test',
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Annotation);

      done();
    });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Annotation.insertOne;
    Annotation.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    let testCase = 0;

    Annotation.create(
      'sequenceId',
      TestAnnotations[testCase].name,
      TestAnnotations[testCase].description,
      TestAnnotations[testCase].start,
      TestAnnotations[testCase].end,
      TestAnnotations[testCase].isForwardStrand,
      'userid12test',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Annotation.insertOne = realInsertOne;

      done();
    });
  });

  lab.test('it returns a result when finding by sequenceId', (done) => {

    Annotation.findBySequenceId('sequenceId', (err,results) => {

      Code.expect(err).to.not.exist();
      Code.expect(results[0]).to.be.an.instanceOf(Annotation);

      done();
    });
  });
});
