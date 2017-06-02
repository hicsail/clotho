'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Feature = require('./feature');

class BasicModule extends MongoModels {


  static create(name, description, role, features, userId, callback) {

    const document = {
      name: name,
      description: description,
      role: role,
      features: features,
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

// public void addFeature(Feature feature) {
//   if (features == null) {
//     features = new HashSet<Feature>();
//   }
//   features.add(feature);
// }

//
// @NotNull
// @Size(min=1)
// @Getter
// @Setter
// @ReferenceCollection
// protected Set<Feature> features;



BasicModule.collection = 'basicmodules';

BasicModule.schema = Joi.object().keys({
  _id: Joi.object(),
  features: Joi.array().items(Feature.schema).required(),
  name: Joi.string().required(),
  description: Joi.string(),
  role: Joi.string().valid('TRANSCRIPTION', 'TRANSLATION', 'EXPRESSION', 'COMPARTMENTALIZATION', 'LOCALIZATION', 'SENSOR', 'REPORTER', 'ACTIVATION', 'REPRESSION').required(),
  userId: Joi.string().required()
});

BasicModule.indexes = [
  {key: {userId: 1}}
];

module.exports = BasicModule;
