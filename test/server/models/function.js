'use strict';
const Function = require('../../../server/models/function');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');


const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');


lab.experiment('Function Class Methods', () => {

  lab.before((done) => {

    Function.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Function.deleteMany({}, (err, count) => {

      Function.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Function.create('name', 'description', 'userId', 'language', 'code', 'inputs', 'outputs', 'working', (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Function);

      done();
    });
  });


  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Function.insertOne;
    Function.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Function.create('name', 'description', 'userId', 'language', 'code', 'inputs', 'outputs', 'working', (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Function.insertOne = realInsertOne;

      done();
    });
  });

  lab.test('it returns an instance when findByName succeeds', (done) => {

    Function.findByName('name', (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Function);

      done();
    });
  });


  lab.test('it returns an error when findByName fails', (done) => {

    const realFind = Function.findOne;
    Function.findOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('find failed'));
    };

    Function.findByName('name', (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Function.findOne = realFind;

      done();
    });
  });
});
