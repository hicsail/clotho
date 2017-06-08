'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Feature = require('./feature');

class Influence extends MongoModels {

  static create(name, description, influencingFeature, influencedFeature, type, userId, callback) {

    const document = {
      name: name,
      description: description,
      influencingFeature: influencingFeature,
      influencedFeature: influencedFeature,
      type: type,
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


Influence.collection = 'influences';

Influence.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  influencingFeature: Feature.schema.required(),
  influencedFeature: Feature.schema.required(),
  type: Joi.string().valid('REPRESSION', 'ACTIVATION').required(),
  parentInfluenceId: Joi.string(),
  userId: Joi.string().required()
});

Influence.indexes = [
  {key: {userId: 1}}
];

module.exports = Influence;
