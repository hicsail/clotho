'use strict';
const Annotation = require('../../../server/models/annotation');
const Feature = require('../../../server/models/feature');
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
      TestAnnotations[testCase].name,
      TestAnnotations[testCase].description,
      'userid12test',
      'sequenceId',
      TestAnnotations[testCase].start,
      TestAnnotations[testCase].end,
      TestAnnotations[testCase].isForwardStrand,
    (err, result) => {

      Feature.create(
        TestAnnotations[testCase].name,
        TestAnnotations[testCase].description,
        'userid12test',
        'displayId',
        'BARCODE',
        result._id.toString(),
      (err, feature) => {

        Code.expect(err).to.not.exist();
        Code.expect(result).to.be.an.instanceOf(Annotation);

        done();
      });
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
      TestAnnotations[testCase].name,
      TestAnnotations[testCase].description,
      'userid12test',
      'sequenceId',
      TestAnnotations[testCase].start,
      TestAnnotations[testCase].end,
      TestAnnotations[testCase].isForwardStrand,
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Annotation.insertOne = realInsertOne;

      done();
    });
  });

  lab.test('it returns a result when finding by sequenceId succeeds', (done) => {

    Annotation.findBySequenceId('sequenceId', (err, results) => {

      Code.expect(err).to.not.exist();
      Code.expect(results[0]).to.be.an.instanceOf(Annotation);

      done();
    });
  });

  lab.test('it returns a result when finding by sequenceId succeeds', (done) => {

    let testCase = 0;

    Annotation.create(
      TestAnnotations[testCase].name,
      TestAnnotations[testCase].description,
      'userid12test',
      'sequenceId2',
      TestAnnotations[testCase].start,
      TestAnnotations[testCase].end,
      TestAnnotations[testCase].isForwardStrand,
    (err, result) => {

      Annotation.findBySequenceId('sequenceId2', (err, results) => {

        Code.expect(err).to.not.exist();
        Code.expect(results[0]).to.be.an.instanceOf(Annotation);

        done();
      });
    });
  });

  lab.test('it returns an error when finding by sequenceId fails', (done) => {

    const realFind = Annotation.find;
    Annotation.find = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('failed'));
    };

    Annotation.findBySequenceId('sequenceId', (err, results) => {

      Code.expect(err).to.be.an.object();
      Code.expect(results).to.not.exist();

      Annotation.find = realFind;

      done();
    });
  });

  lab.test('it returns an error when finding by getFeatures fails', (done) => {

    const realFind = Feature.findByAnnotationId;
    Feature.findByAnnotationId = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('failed'));
    };

    Annotation.findBySequenceId('sequenceId', (err, results) => {

      Code.expect(err).to.be.an.object();
      Code.expect(results).to.not.exist();

      Feature.findByAnnotationId = realFind;

      done();
    });
  });
});
