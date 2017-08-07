'use strict';
const ExperimentDesign = require('../../../server/models/experiment-design');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('ExperimentDesign Class Methods', () => {

  lab.before((done) => {

    ExperimentDesign.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    ExperimentDesign.deleteMany({}, (err, count) => {

      ExperimentDesign.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    ExperimentDesign.create(
      'experimentDesign',
      'experimentDesign description',
      'userid12test',
      'controlledVariables',
      'responseVariables',
      (err, result) => {

        Code.expect(err).to.not.exist();
        Code.expect(result).to.be.an.instanceOf(ExperimentDesign);

        done();
      });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = ExperimentDesign.insertOne;
    ExperimentDesign.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    ExperimentDesign.create(
      'ExperimentDesign',
      'ExperimentDesign Description',
      'userid12test',
      'controlledVariables',
      'responseVariables',
      (err, result) => {

        Code.expect(err).to.be.an.object();
        Code.expect(result).to.not.exist();

        ExperimentDesign.insertOne = realInsertOne;

        done();
      });
  });
});
