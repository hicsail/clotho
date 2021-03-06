'use strict';
const Container = require('../../../server/models/container');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('Container Class Methods', () => {

  lab.before((done) => {

    Container.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Container.deleteMany({}, (err, count) => {

      Container.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Container.create(
      'name',
      'description',
      'userId',
      'parameterIds',
      'type',
      'coordinates',
      (err, result) => {

        Code.expect(err).to.not.exist();
        Code.expect(result).to.be.an.instanceOf(Container);

        done();
      });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Container.insertOne;
    Container.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Container.create(
      'name',
      'description',
      'userId',
      'parameterIds',
      'type',
      'coordinates',
      (err, result) => {

        Code.expect(err).to.be.an.object();
        Code.expect(result).to.not.exist();

        Container.insertOne = realInsertOne;

        done();
      });
  });
});
