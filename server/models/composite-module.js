'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Module = require('module');
const ModuleRole = require('module-role');

class CompositeModule extends MongoModels {

  static create(name, role, submodules, author, callback) {
    return create(name, null, role, submodules, author, callback);
  }

  static create(name, description, role, submodules, author_id, callback) {
    const document = {
      name: name,
      description: description,
      role: role,
      submodules: submodules,
      author_id: author_id
    };

    this.insertOne(document, (err, docs) => {
      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}


CompositeModule.collection = 'compositemodules';

CompositeModule.schema = Joi.object().keys({
  _id: Joi.object(),
  submodules: Joi.array().items(Module.schema),
  name: Joi.string().required(),
  author_id: Joi.string().required(),
  description: Joi.string(),
  role: ModuleRole.schema
});

CompositeModule.indexes = [];

module.exports = CompositeModule;
