'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Feature = require('./feature');
const Role = require('./role');

class Module extends MongoModels {
  static create(name, description, userId, displayId, bioDesignId, role, submoduleIds, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      displayId: displayId,
      bioDesignId: bioDesignId,
      role: role,
      submoduleIds: submoduleIds
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });

  }


  static getModuleByBioDesignId(bioDesignId, query, callback) {

    if (query === null) {
      query = {};
    }

    if (typeof bioDesignId == 'string') {
      query['bioDesignId'] = bioDesignId;
    } else if (bioDesignId !== undefined && bioDesignId !== null && bioDesignId.length > 0) {
      query['bioDesignId'] = {$in: bioDesignId};
    }


    this.find(query, (err, results) => {

      if (err) {
        return callback(err);
      }


      callback(err, results);
    });
  }

  static findByBioDesignId(bioDesignId, callback) {

    const query = {bioDesignId: bioDesignId};

    this.find(query, (err, modules) => {

      if (err) {
        return callback(err);
      }

      this.getFeatures(0, modules, callback);
    });
  }

  static getFeatures(index, modules, callback) {

    if (index == modules.length) {
      return callback(null, modules);
    }

    Feature.findByModuleId(modules[index]['_id'].toString(), (err, features) => {

      if (err) {
        return callback(err, null);
      }

      if (features.length != 0) {
        modules[index].features = features;
      }

      return this.getFeatures(index + 1, modules, callback);
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
  role: Joi.string().uppercase().required(),
  featureIds: Joi.array().items(Joi.string()),
  influenceIds: Joi.array().items(Joi.string()), // Should this be an array of schemas instead?
  parentModuleId: Joi.string(),
  submoduleIds: Joi.array().items(Joi.string())
});

Module.indexes = [
  {key: {userId: 1}}
];

module.exports = Module;
