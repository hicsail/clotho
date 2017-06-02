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
      TestSequences[testCase].sequence,
      TestSequences[testCase].isLinear,
      TestSequences[testCase].isSingleStranded,
      'userid12test',
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
      TestSequences[testCase].sequence,
      TestSequences[testCase].isLinear,
      TestSequences[testCase].isSingleStranded,
      'userid12test',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Sequence.insertOne = realInsertOne;

      done();
    });
  });

  lab.test('it returns sequence by userId', (done) => {

    Sequence.findByUserId('userid12test',(err,usersSeqences) => {

      Code.expect(err).to.not.exist();
      Code.expect(usersSeqences[0]).to.be.an.instanceOf(Sequence);

      done();
    });
  });

  lab.test('it return sequence with annotations by userId', (done) => {

    Sequence.findOne({},(err,sequence) => {

      var testCase = 0;

      Annotation.create(
        sequence._id,
        TestAnnotations[testCase].name,
        TestAnnotations[testCase].description,
        TestAnnotations[testCase].start,
        TestAnnotations[testCase].end,
        TestAnnotations[testCase].isForwardStrand,
        'userid12test',
      (err, result) => {

        Sequence.findByUserId('userid12test', (err, usersSeqences) => {

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

    Sequence.findByUserId('userid12test', (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Sequence.findByUserId = realFindById;

      done();
    });
  });

/* test should be converted to api tests
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
      TestSequences[testCase].sequence,
      null,
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Sequence.insertOne = realInsertOne;

      done();
    });
  });

  lab.test('it returns a new instance when create succeeds with a sequence of uppercase letters', (done) => {

    let testCase = 0;

    Sequence.create(
      TestSequences[testCase].name,
      TestSequences[testCase].description,
      TestSequences[testCase].sequence,
      TestSequences[testCase].userId,
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Sequence);

      done();
    });
  });

  lab.test('it returns a new instance when create succeeds with a sequence of lowercase letters', (done) => {

    let testCase = 1;

    Sequence.create(
      TestSequences[testCase].name,
      TestSequences[testCase].description,
      TestSequences[testCase].sequence,
      TestSequences[testCase].userId,
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Sequence);

      done();
    });
  });

  lab.test('it returns a new instance when create succeeds with a sequence of mixed case letters', (done) => {

    let testCase = 2;

    Sequence.create(
      TestSequences[testCase].name,
      TestSequences[testCase].description,
      TestSequences[testCase].sequence,
      TestSequences[testCase].userId,
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Sequence);

      done();
    });
  });

  lab.test('it returns an error when create fails with a sequence of incorrect lowercase case letters', (done) => {

    let testCase = 3;

    Sequence.create(
      TestSequences[testCase].name,
      TestSequences[testCase].description,
      TestSequences[testCase].sequence,
      TestSequences[testCase].userId,
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Sequence);

      done();
    });
  });

  lab.test('it returns an error when create fails with a sequence of incorrect uppercase case letters', (done) => {

    let testCase = 4;

    Sequence.create(
      TestSequences[testCase].name,
      TestSequences[testCase].description,
      TestSequences[testCase].sequence,
      TestSequences[testCase].userId,
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Sequence);

      done();
    });
  });

  lab.test('it returns an error when create fails with a sequence of incorrect mixed case letters', (done) => {

    let testCase = 5;

    Sequence.create(
      TestSequences[testCase].name,
      TestSequences[testCase].description,
      TestSequences[testCase].sequence,
      TestSequences[testCase].userId,
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Sequence);

      done();
    });
  });

  lab.test('it returns a new instance when create succeeds with a large sequence', (done) => {

    let testCase = 6;

    Sequence.create(
      TestSequences[testCase].name,
      TestSequences[testCase].description,
      TestSequences[testCase].sequence,
      TestSequences[testCase].userId,
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Sequence);

      done();
    });
  });

  lab.test('it returns a new instance when create succeeds with all allowed uppercase squence characters', (done) => {

    let testCase = 7;

    Sequence.create(
      TestSequences[testCase].name,
      TestSequences[testCase].description,
      TestSequences[testCase].sequence,
      TestSequences[testCase].userId,
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Sequence);

      done();
    });
  });

  lab.test('it returns a new instance when create succeeds with all allowed lowercase squence characters', (done) => {

    let testCase = 8;

    Sequence.create(
      TestSequences[testCase].name,
      TestSequences[testCase].description,
      TestSequences[testCase].sequence,
      TestSequences[testCase].userId,
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Sequence);

      done();
    });
  });

  lab.test('it returns a new instance when create succeeds with all allowed mixed case squence characters', (done) => {

    let testCase = 9;

    Sequence.create(
      TestSequences[testCase].name,
      TestSequences[testCase].description,
      TestSequences[testCase].sequence,
      TestSequences[testCase].userId,
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Sequence);

      done();
    });
  });
*/
});
