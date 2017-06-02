'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Strain extends MongoModels {
  static create(name, userId, description, callback) {

    const document = {
      name: name,
      userId: userId,
      description: description
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}


Strain.collection = 'strains';

Strain.schema = Joi.object().keys({
  _id: Joi.object(),
  polynucleotides: Joi.array().items(Joi.string()), // Set of sequences.
  parentStrainId: Joi.string(),
  name: Joi.string().required(),
  userId: Joi.string().required(),
  description: Joi.string()
});

Strain.indexes = [
  {key: {userId: 1}}
];

module.exports = Strain;
