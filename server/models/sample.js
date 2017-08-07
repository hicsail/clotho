'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Parameter = require('./parameter');

class Sample extends MongoModels {
  static create(name, description, userId, containerId, bioDesignId, parameterIds, parentSampleIds, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      containerId: containerId,
      bioDesignId: bioDesignId,
      parameterIds: parameterIds,
      parentSampleIds: parentSampleIds
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }

  static delete(document, callback) {

    document.toDelete = true;
    this.findByIdAndUpdate(document._id.toString(), document, callback);
  }
}


Sample.collection = 'samples';

Sample.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  bioDesignId: Joi.string(),
  parameterIds: Joi.array().items(Joi.string()),
  containerId: Joi.string().required(),
  parentSampleIds: Joi.array().items(Joi.string())
});

Sample.payload = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  bioDesignId: Joi.string().required(),
  parameters: Joi.array().items(Parameter.payload).optional(),
  containerId: Joi.string().optional(),
  parentSampleIds: Joi.array().items(Joi.string())
});

Sample.indexes = [
  {key: {userId: 1}}
];

module.exports = Sample;
