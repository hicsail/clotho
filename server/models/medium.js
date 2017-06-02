'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Medium extends MongoModels {
  static create(name, description, userId, callback) {

    const document = {
      name: name,
      description: description,
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


Medium.collection = 'media';

Medium.schema = Joi.object().keys({
  _id: Joi.object(),
  parentMediumId: Joi.string(),
  name: Joi.string().required(),
  userId: Joi.string().required(),
  description: Joi.string()
});

Medium.indexes = [
  {key: {userId: 1}}
];

module.exports = Medium;
