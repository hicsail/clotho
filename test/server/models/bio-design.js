'use strict';
const BioDesign = require('../../../server/models/bio-design');
const Code = require('code');
const Config = require('../../../config');
const Lab = require('lab');

const lab = exports.lab = Lab.script();
const mongoUri = Config.get('/hapiMongoModels/mongodb/uri');
const mongoOptions = Config.get('/hapiMongoModels/mongodb/options');

lab.experiment('BioDesign Class Methods', () => {

  lab.before((done) => {

    BioDesign.connect(mongoUri, mongoOptions, (err, db) => {

      done(err);
    });
  });


  lab.after((done) => {

    BioDesign.deleteMany({}, (err, count) => {

      BioDesign.disconnect();

      done(err);
    });
  });


  lab.test('it returns a new instance when create succeeds', (done) => {

    BioDesign.create(
      'BioDesign',
      'BioDesign Description',
      'userid12test',
      'displayId',
    (err, result) => {

      Code.expect(err).to.not.exist();
      Code.expect(result).to.be.an.instanceOf(BioDesign);

      done();
    });
  });

  lab.test('it returns an error when create fails', (done) => {

    const realInsertOne = BioDesign.insertOne;
    BioDesign.insertOne = function () {

      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();

      callback(Error('insert failed'));
    };

    BioDesign.create(
      'BioDesign',
      'BioDesign Description',
      'userid12test',
      'displayId',
    (err, result) => {

      Code.expect(err).to.be.an.object();
      Code.expect(result).to.not.exist();

      BioDesign.insertOne = realInsertOne;

      done();
    });
  });
});
