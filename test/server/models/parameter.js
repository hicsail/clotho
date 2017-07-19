'use strict';
const Parameter = require('../../../server/models/parameter');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('Parameter Class Methods', () => {

  lab.before((done) => {

    Parameter.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Parameter.deleteMany({}, (err, count) => {

      Parameter.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Parameter.create(
      'name',
      'userid12test',
      'bioDesignId',
      'value',
      'variable',
      'units',
      (err, result) => {

        Code.expect(err).to.not.exist();
        Code.expect(result).to.be.an.instanceOf(Parameter);

        done();
      });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Parameter.insertOne;
    Parameter.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Parameter.create(
      'name',
      'userid12test',
      'bioDesignId',
      'value',
      'variable',
      'units',
      (err, result) => {

        Code.expect(err).to.be.an.object();
        Code.expect(result).to.not.exist();

        Parameter.insertOne = realInsertOne;

        done();
      });
  });

  lab.test('it returns a instance when getParameterByBioDesignId succeeds', (done) => {

    Parameter.getParameterByBioDesignId(
      ['bioDesignId'],
      null,
      (err, result) => {

        Code.expect(err).to.not.exist();
        Code.expect(result[0]).to.be.an.instanceOf(Parameter);

        done();
      });
  });

  lab.test('it returns a instance when getParameterByBioDesignId succeeds', (done) => {

    Parameter.getParameterByBioDesignId(
      ['bioDesignId'],
      [{
        value: 'value',
        variable: 'variable',
        name: 'name'
      }],
      (err, result) => {

        Code.expect(err).to.not.exist();
        Code.expect(result[0]).to.be.an.instanceOf(Parameter);

        done();
      });
  });

  lab.test('it returns an error when getParameterByBioDesignId fails', (done) => {

    const realFind = Parameter.find;
    Parameter.find = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('failed'));
    };

    Parameter.getParameterByBioDesignId(
      ['bioDesignId'],
      null,
      (err, result) => {

        Code.expect(err).to.be.an.object();
        Code.expect(result).to.not.exist();

        Parameter.find = realFind;

        done();
      });
  });
});
