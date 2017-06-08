'use strict';
const Feature = require('../../../server/models/feature');
const Config = require('../../../config');
const Lab = require('lab');
const Code = require('code');

const TestFeatures = require('../testData/features');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('Feature Class Methods', () => {

  lab.before((done) => {

    Feature.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });

  lab.after((done) => {

    Feature.deleteMany({}, (err, count) => {

      Feature.disconnect();

      done(err);
    });
  });

  lab.test('it returns a new instance when create succeeds', (done) => {

    let testCase = 0;

    Feature.create(
      'annotationId',
      TestFeatures[testCase].name,
      TestFeatures[testCase].description,
      TestFeatures[testCase].role,
      'userid12test',
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Feature);

      done();
    });
  });


  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Feature.insertOne;
    Feature.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    let testCase = 0;

    Feature.create(
      'annotationId',
      TestFeatures[testCase].name,
      TestFeatures[testCase].description,
      TestFeatures[testCase].role,
      'userid12test',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Feature.insertOne = realInsertOne;

      done();
    });
  });

  lab.test('it returns an instance when finding by annotation succeeds', (done) => {

    Feature.findByAnnotationId(
      'annotationId',
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result[0]).to.be.an.instanceOf(Feature);

      done();
    });
  });

  lab.test('it returns an error when finding by annotation fails', (done) => {

    const realInsertOne = Feature.find;
    Feature.find = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('find failed'));
    };

    Feature.findByAnnotationId(
      'annotationId',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Feature.find = realInsertOne;

      done();
    });
  });

});
