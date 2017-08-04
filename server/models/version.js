'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const ObjectID = require('mongo-models').ObjectID;

class Version extends MongoModels {

  static create(userId, objectId, versionNumber, collectionName, callback) {

    const document = {
      userId: userId,
      objectId: objectId,
      versionNumber: versionNumber,
      collectionName: collectionName,
      time: new Date()
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }


//finds newest version and returns it
  static findNewest(bioDesignId, collectionName, callback) {

    this.find({objectId: ObjectID(bioDesignId), collectionName: collectionName}, (err, results) => {

      console.log(results);
      if (err) {
        return callback(err);

      } else if (results[0]['replacementVersionId'] === null || results[0]['replacementVersionId'] === undefined || results.length === 0) {

        callback(null, [bioDesignId, results[0]['versionNumber']])


      } else {
        this.findNewest(results[0]['replacementVersionId'], callback)
      }
    })
  }

}


Version.collection = 'versions';

Version.schema = Joi.object().keys({
  _id: Joi.object(),
  userId: Joi.string(),
  objectId: Joi.string(),
  versionNumber: Joi.number(),
  collectionName: Joi.string(),
  time: Joi.date(),
  replacementVersionId: Joi.string()
});

Version.indexes = [
  {key: {objectId: 1}},
  {key: {userId: 1}}
];

module.exports = Version;
