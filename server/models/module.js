'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Module extends MongoModels {
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


Module.collection = 'modules';

Module.schema = Joi.object().keys({
  _id: Joi.object()
});

Module.indexes = [];

module.exports = Module;
