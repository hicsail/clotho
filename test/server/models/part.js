'use strict';
const Part = require('../../../server/models/part');
const Sequence = require('../../../server/models/sequence');
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
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Part.insertOne = realInsertOne;

      done();
    });
  });

  lab.test('it returns an instance when findByBioDesign succeeds', (done) => {

    Part.findByBioDesignId(
      'bioDesignId',
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result[0]).to.be.an.instanceOf(Part);

      done();
    });
  });

  lab.test('it returns an instance when findByBioDesign succeeds', (done) => {

    Part.create(
      'name',
      'description',
      'userId',
      'displayId',
      'bioDesignId',
    (err, part) => {

      Sequence.create(
        'name',
        'description',
        'userId',
        'displayId',
        'featureId',
        part._id.toString(),
        'sequenceAsInATGAGATA',
        true,
        false,
      (err, sequence) => {

        Part.findByBioDesignId(
          'bioDesignId',
        (err, result) => {

          Code.expect(err).to.not.exist();
          Code.expect(result[0]).to.be.an.instanceOf(Part);

          done();
        });
      });
    });
  });

  lab.test('it returns an error when findByBioDesign fails', (done) => {

    const realfindByBioDesignId = Part.findByBioDesignId;
    Part.findByBioDesignId = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Part.findByBioDesignId(
      'bioDesignId',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Part.findByBioDesignId = realfindByBioDesignId;

      done();
    });
  });

  lab.test('it returns an error when findByBioDesign fails', (done) => {

    const realfind = Part.find;
    Part.find = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('failed'));
    };

    Part.findByBioDesignId(
      'bioDesignId',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Part.find = realfind;

      done();
    });
  });

  lab.test('it returns an error when findByBioDesign fails', (done) => {

    const realFindByPartId = Sequence.findByPartId;
    Sequence.findByPartId = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Part.findByBioDesignId(
      'bioDesignId',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Sequence.findByPartId = realFindByPartId;

      done();
    });
  });
});
