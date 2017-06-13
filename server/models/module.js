'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Module extends MongoModels {

  static create(name, description, userId, displayId, bioDesignId, role, featureIds, submoduleIds, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      displayId: displayId,
      bioDesignId: bioDesignId,
      role: role,
      featureIds: featureIds,
      submoduleIds: submoduleIds
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }

  static findByBioDesignId(bioDesignIds, filters, callback) {

    var query = {bioDesignId: {$in: bioDesignIds}};

    for (var f in filters) {
      query[f] = filters[f];
    }

    this.find(query, (err, results) => {

      if (err) {
        return callback(err);
      }

      callback(err, results);
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
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  displayId: Joi.string().optional(),
  bioDesignId: Joi.string(),
  role: Joi.string().valid('TRANSCRIPTION', 'TRANSLATION', 'EXPRESSION', 'COMPARTMENTALIZATION', 'LOCALIZATION', 'SENSOR', 'REPORTER', 'ACTIVATION', 'REPRESSION').required(),
  featureIds: Joi.array().items(Joi.string()),
  influenceIds: Joi.array().items(Joi.string()), // Should this be an array of schemas instead?
  parentModuleId: Joi.string(),
  submoduleIds: Joi.array().items(Joi.string())
});

Module.indexes = [
  {key: {userId: 1}}
];

module.exports = Module;
