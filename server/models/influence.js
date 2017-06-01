'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Influence extends MongoModels {

  static create(callback) {

    const document = {
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
  _id: Joi.object()
});

Influence.indexes = [
  {key: {userId: 1}}
];

module.exports = Influence;
