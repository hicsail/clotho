'use strict';
const Experiment = require('../../../server/models/experiment');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('Experiment Class Methods', () => {

  lab.before((done) => {

    Experiment.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Experiment.deleteMany({}, (err, count) => {

      Experiment.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Experiment.create(
      'experiment',
      'experiment description',
      'userid12test',
      'experimentDesignId',
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Experiment);

      done();
    });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Experiment.insertOne;
    Experiment.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Experiment.create(
      'Experiment',
      'Experiment Description',
      'userid12test',
      'experimentDesignId',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Experiment.insertOne = realInsertOne;

      done();
    });
  });
});
