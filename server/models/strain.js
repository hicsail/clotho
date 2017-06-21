'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Strain extends MongoModels {

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


Strain.collection = 'strains';

Strain.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  parentStrainId: Joi.string(),
  polynucleotides: Joi.array().items(Joi.string()) // Set of sequences.
});

Strain.indexes = [
  {key: {userId: 1}}
];

module.exports = Strain;
