'use strict';
const Medium = require('../../../server/models/medium');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('Medium Class Methods', () => {

  lab.before((done) => {

    Medium.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Medium.deleteMany({}, (err, count) => {

      Medium.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Medium.create(
      'medium',
      'medium description',
      'userid12test',
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Medium);

      done();
    });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Medium.insertOne;
    Medium.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Medium.create(
      'Medium',
      'Medium Description',
      'userid12test',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Medium.insertOne = realInsertOne;

      done();
    });
  });
});
