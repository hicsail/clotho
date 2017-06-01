'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class ModuleRole extends MongoModels {
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


ModuleRole.collection = 'moduleroles';

ModuleRole.schema = Joi.object().keys({
  _id: Joi.object()
});

ModuleRole.indexes = [];

module.exports = ModuleRole;
