'use strict';
const Part = require('../../../server/models/part');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('Part Class Methods', () => {

  lab.before((done) => {

    Part.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Part.deleteMany({}, (err, count) => {

      Part.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Part.create(
      'part1',
      'part description',
      'userid12test',
      'displayId',
      'bioDesignId',
      'sequence',
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Part);

      done();
    });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Part.insertOne;
    Part.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Part.create(
      'part1',
      'part description',
      'userid12test',
      'displayId',
      'bioDesignId',
      'sequence',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Part.insertOne = realInsertOne;

      done();
    });
  });
});
