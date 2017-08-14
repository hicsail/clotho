'use strict';
const Sequence = require('../../../server/models/sequence');
const Annotation = require('../../../server/models/annotation');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const TestSequences = require('../testData/sequences');
const TestAnnotations = require('../testData/annotations');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('Sequence Class Methods', () => {

  lab.before((done) => {

    Sequence.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Sequence.deleteMany({}, (err, count) => {

      Sequence.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    let testCase = 0;

    Sequence.create(
      TestSequences[testCase].name,
      TestSequences[testCase].description,
      'userId',
      'displayId',
      null, //featureId
      'partId',
      TestSequences[testCase].sequence,
      TestSequences[testCase].isLinear,
      TestSequences[testCase].isSingleStranded,
      (err, result) => {

        Code.expect(err).to.not.exist();
        Code.expect(result).to.be.an.instanceOf(Sequence);

        done();
      });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Sequence.insertOne;
    Sequence.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    let testCase = 0;

    Sequence.create(
      TestSequences[testCase].name,
      TestSequences[testCase].description,
      'userId',
      'displayId',
      null,
      'partId',
      TestSequences[testCase].sequence,
      TestSequences[testCase].isLinear,
      TestSequences[testCase].isSingleStranded,
      (err, result) => {

        Code.expect(err).to.be.an.object();
        Code.expect(result).to.not.exist();

        Sequence.insertOne = realInsertOne;

        done();
      });
  });

  lab.test('it returns sequence by userId', (done) => {

    Sequence.findByUserId('userId', (err, usersSeqences) => {

      Code.expect(err).to.not.exist();
      Code.expect(usersSeqences[0]).to.be.an.instanceOf(Sequence);

      done();
    });
  });

  lab.test('it return sequence with annotations by userId', (done) => {

    Sequence.findOne({}, (err, sequence) => {

      var testCase = 0;

      Annotation.create(
        TestAnnotations[testCase].name,
        TestAnnotations[testCase].description,
        'userId',
        sequence._id.toString(),
        'superSequenceId',
        TestAnnotations[testCase].start,
        TestAnnotations[testCase].end,
        TestAnnotations[testCase].isForwardStrand,
        (err, result) => {

          Sequence.findByUserId('userId', (err, usersSeqences) => {

            Code.expect(err).to.not.exist();
            Code.expect(usersSeqences[0]).to.be.an.instanceOf(Sequence);
            //Code.expect(usersSeqences['annotations'][0]).to.be.an.instanceOf(Annotation);

            done();
          });
        });
    });
  });

  lab.test('it returns an error when finding sequence by userId', (done) => {

    const realFindById = Sequence.findByUserId;
    Sequence.findByUserId = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('find by userid failed'));
    };

    Sequence.findByUserId('userId', (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Sequence.findByUserId = realFindById;

      done();
    });
  });

  lab.test('it returns an error when finding sequence by userId fails', (done) => {

    const realFind = Sequence.find;
    Sequence.find = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('find by userid failed'));
    };

    Sequence.findByUserId('userId', (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Sequence.find = realFind;

      done();
    });
  });

  lab.test('it returns an error when finding sequence by userId fails', (done) => {

    const findBySequenceId = Annotation.findBySequenceId;
    Annotation.findBySequenceId = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('find by userid failed'));
    };

    Sequence.findByUserId('userId', (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Annotation.findBySequenceId = findBySequenceId;

      done();
    });
  });

  lab.test('it return an error when findByPartId fails', (done) => {

    const realFind = Sequence.find;
    Sequence.find = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('failed'));
    };

    Sequence.findByPartId('partId', (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Sequence.find = realFind;

      done();
    });
  });

  lab.test('it returns sequence by getSequenceBySequenceString when succeeds', (done) => {

    var testCase = 0;

    Sequence.getSequenceBySequenceString(TestSequences[testCase].sequence, (err, usersSeqences) => {

      Code.expect(err).to.not.exist();
      Code.expect(usersSeqences[0]).to.equal('partId');

      done();
    });
  });

  lab.test('it returns an error by getSequenceBySequenceString when fails', (done) => {

    var testCase = 0;

    const realFind = Sequence.find;
    Sequence.find = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('failed'));
    };

    Sequence.getSequenceBySequenceString(TestSequences[testCase].sequence, (err, usersSeqences) => {

      Code.expect(err).to.be.an.object();
      Code.expect(usersSeqences).to.not.exist();

      Sequence.find = realFind;

      done();
    });
  });
});
