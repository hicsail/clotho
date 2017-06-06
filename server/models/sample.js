'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Sample extends MongoModels {
  static create(name, description, containerId, userId, callback) {

    const document = {
      name: name,
      description: description,
      containerId: containerId,
      userId: userId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}


Sample.collection = 'samples';

Sample.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  containerId: Joi.string().required(),
  userId: Joi.string().required(),
  bioDesignId: Joi.string(),
  parameterIds: Joi.array().items(Joi.string()),
  parentSampleIds: Joi.array().items(Joi.string())
});

Sample.indexes = [
  {key: {userId: 1}}
];

module.exports = Sample;
