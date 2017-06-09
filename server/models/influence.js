'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Feature = require('./feature');

class Influence extends MongoModels {

  static create(name, description, userId, type, influencedFeature, influencingFeature, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      type: type,
      influencedFeature: influencedFeature,
      influencingFeature: influencingFeature
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}


Influence.collection = 'influences';

Influence.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  type: Joi.string().valid('REPRESSION', 'ACTIVATION').required(),
  parentInfluenceId: Joi.string(),
  influencingFeature: Feature.schema.required(),
  influencedFeature: Feature.schema.required()
});

Influence.indexes = [
  {key: {userId: 1}}
];

module.exports = Influence;
