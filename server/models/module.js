'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Feature = require('./feature');

class Module extends MongoModels {

  static create(name, description, role, features, submoduleIds, userId, displayId, callback) {

    const document = {
      name: name,
      description: description,
      role: role,
      features: features,
      submoduleIds: submoduleIds,
      userId: userId,
      displayId: displayId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}

//
// public void addInfluence(Influence influence) {
//   if (influences == null) {
//     influences = new HashSet<Influence>();
//   }
//   influences.add(influence);
// }



Module.collection = 'modules';

Module.schema = Joi.object().keys({
  _id: Joi.object(),
  role: Joi.string().valid('TRANSCRIPTION', 'TRANSLATION', 'EXPRESSION', 'COMPARTMENTALIZATION', 'LOCALIZATION', 'SENSOR', 'REPORTER', 'ACTIVATION', 'REPRESSION').required(),
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  influenceIds: Joi.array().items(Joi.string()), // Should this be an array of schemas instead?
  parentModuleId: Joi.string(),
  submoduleIds: Joi.array().items(Joi.string()),
  features: Joi.array().items(Feature.schema),
  displayId: Joi.string().optional()
});

Module.indexes = [
  {key: {userId: 1}}
];

module.exports = Module;
