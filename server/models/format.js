'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Format extends MongoModels {
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


Format.collection = 'formats';

Format.schema = Joi.object().keys({
  _id: Joi.object()
});

Format.indexes = [];

module.exports = Format;
