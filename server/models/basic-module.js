'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Feature = require('feature');
const ModuleRole = require('module-role');
const User = require('user');

class BasicModule extends MongoModels {
  static create(name, modulerole, features, author, callback) {
    return create(name, null, modulerole, features, author, callback);
  }

  static create(name, description, modulerole, features, author, callback) {
    const document = {
      name: name,
      description: description,
      modulerole: modulerole,
      features: features,
      author: author
    };

    this.insertOne(document, (err, docs) => {
      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}

// public void addFeature(Feature feature) {
//   if (features == null) {
//     features = new HashSet<Feature>();
//   }
//   features.add(feature);
// }



BasicModule.collection = 'basicmodules';

BasicModule.schema = Joi.object().keys({
  _id: Joi.object(),
  features: Joi.array().items(Feature.schema).required(),
  name: Joi.string().required(),
  description: Joi.string(),
  role: ModuleRole.schema,
  author: User.schema
});

BasicModule.indexes = [];

module.exports = BasicModule;
