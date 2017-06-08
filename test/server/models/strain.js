'use strict';
const Strain = require('../../../server/models/strain');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('Strain Class Methods', () => {

  lab.before((done) => {

    Strain.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Strain.deleteMany({}, (err, count) => {

      Strain.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Strain.create(
      'strain',
      'strain description',
      'userid12test',
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Strain);

      done();
    });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Strain.insertOne;
    Strain.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Strain.create(
      'Strain',
      'Strain Description',
      'userid12test',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Strain.insertOne = realInsertOne;

      done();
    });
  });
});
