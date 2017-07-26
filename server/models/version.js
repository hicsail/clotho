'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Version extends MongoModels {

  static create(userId, objectId, versionNumber, callback) {

    const document = {
      userId: userId,
      objectId: objectId,
      versionNumber: versionNumber,
      time: new Date()
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}


Version.collection = 'versions';

Version.schema = Joi.object().keys({
  _id: Joi.object(),
  userId: Joi.string(),
  objectId: Joi.string(),
  versionNumber: Joi.number(),
  time: Joi.date(),
  replacementVersionId: Joi.string()
});

Version.indexes = [
  {key: {objectId: 1}},
  {key: {userId: 1}}
];

module.exports = Version;
