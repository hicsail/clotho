'use strict';
const Infulence = require('../../../server/models/influence');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('Infulence Class Methods', () => {

  lab.before((done) => {

    Infulence.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Infulence.deleteMany({}, (err, count) => {

      Infulence.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Infulence.create(
      'infulence',
      'infulence description',
      'userid12test',
      'type',
      'infulencedFeature',
      'infulencingFeature',
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Infulence);

      done();
    });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Infulence.insertOne;
    Infulence.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Infulence.create(
      'infulence',
      'infulence description',
      'userid12test',
      'type',
      'infulencedFeature',
      'infulencingFeature',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Infulence.insertOne = realInsertOne;

      done();
    });
  });
});
