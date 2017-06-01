'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Color extends MongoModels {
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


Color.collection = 'colors';

Color.schema = Joi.object().keys({
  _id: Joi.object()
});

Color.indexes = [];

module.exports = Color;
