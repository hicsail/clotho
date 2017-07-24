'use strict';
const Role = require('../../../server/models/role');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('Role Class Methods', () => {

  lab.before((done) => {

    Role.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    Role.deleteMany({}, (err, count) => {

      Role.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    Role.create(
      'testRole',
      'userId',
      'type',
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(Role);

      done();
    });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = Role.insertOne;
    Role.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    Role.create(
      'newName',
      'userId',
      'type',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Role.insertOne = realInsertOne;

      done();
    });
  });

  lab.test('it returns an error when create fails', (done) => {

    Role.create(
      'testRole',
      'userId',
      'type',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      done();
    });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realFineOne = Role.findOne;
    Role.findOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('findOne failed'));
    };

    Role.create(
      'name',
      'userId',
      'type',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      Role.findOne = realFineOne;

      done();
    });
  });

  lab.test('it returns an true checkValidRole succeeds', (done) => {

    Role.checkValidRole(
      'testRole',
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.equal(true);

      done();
    });
  });

  lab.test('it returns an true checkValidRole succeeds', (done) => {

    Role.checkValidRole(
      'notRole',
      (err, result) => {

        Code.expect(err).to.not.exist();
        Code.expect(result).to.equal(false);

        done();
      });
  });

  lab.test('it returns an false checkValidRole succeeds', (done) => {

    Role.checkValidRole(
      null,
      (err, result) => {

        Code.expect(err).to.not.exist();
        Code.expect(result).to.equal(false);

        done();
      });
  });

  lab.test('it returns an false checkValidRole succeeds', (done) => {

    Role.checkValidRole(
      undefined,
      (err, result) => {

        Code.expect(err).to.not.exist();
        Code.expect(result).to.equal(false);

        done();
      });
  });

  lab.test('it returns an error checkValidRole fails', (done) => {

    const findOne = Role.findOne;

    Role.findOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('findOne failed'));
    };

    Role.checkValidRole(
      'name',
      (err, result) => {

        Code.expect(err).to.be.an.object();
        Code.expect(result).to.not.exist();

        Role.findOne = findOne;

        done();
      });
  });
});
