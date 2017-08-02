'use strict';
const Assembly = require('../../../server/models/assembly');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('Assembly Class Methods', () => {

  lab.before((done) => {

    Assembly.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Assembly.deleteMany({}, (err, count) => {

      Assembly.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Assembly.create(
      ['subBioDesignIds'],
      'userid12test',
      'subPartIds',
      (err, result) => {

        Code.expect(err).to.not.exist();
        Code.expect(result).to.be.an.instanceOf(Assembly);

        done();
      });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Assembly.insertOne;
    Assembly.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Assembly.create(
      ['subBioDesignIds'],
      'userid12test',
      'subPartIds',
      (err, result) => {

        Code.expect(err).to.be.an.object();
        Code.expect(result).to.not.exist();

        Assembly.insertOne = realInsertOne;

        done();
      });
  });
});
