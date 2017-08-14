'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Feature = require('./feature');

class Module extends MongoModels {
  static create(name, description, userId, displayId, bioDesignId, role, submoduleIds, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      displayId: displayId,
      bioDesignId: bioDesignId,
      role: role.toUpperCase(),
      submoduleIds: submoduleIds
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });

  }

  static getByModule(role, options, callback) {


    var query = {role: role};
    for (var attrname in options) {
      query[attrname] = options[attrname];
    }

    this.find(query, (err, modules) => {

      if (err) {
        return callback(err);
      }
      this.getBioDesignIdsbyModule(modules, callback);

    });

  }

  static getBioDesignIdsbyModule(modules, callback) {

    var bioDesignIds = [];

    if (modules.length > 0) {

      for (var i = 0; i < modules.length; ++i) {
        bioDesignIds.push(modules[i]['bioDesignId']);
      }
    }
    callback(null, bioDesignIds);
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

      this.getFeatures(0, modules, callback); //should we return features twice if sequence-annotations-features also exists?
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

  // Update module and Feature with role.
  static updateModule(bioDesignId, name, userId, displayId, role, annotationId, callback) {

    this.findOne({bioDesignId: bioDesignId}, (err, modules) => {

      if (err) return callback(err);

      // No module found. Make new module.
      if (modules === null && modules.length === 0) {

        //Make new module.
        this.create(name, null, userId, displayId, bioDesignId, role, null, (err, moduleId) => {

          if (err) return callback(err);

          // Make new feature, linking up with annotationId.

          Feature.create(name, null, userId, displayId, role, annotationId, moduleId, callback);

        });


      } else {
        // Module already exists.

        this.updateOne({bioDesignId: bioDesignId}, {$set: {role: role}}, (err, count, moduleDoc) => {

          if (err) return callback(err);

          Feature.updateOne({bioDesignId: bioDesignId}, {
            $set: {
              role: role,
              annotationId: annotationId
            }
          }, (err, count, featureDoc) => {

            if (err) return callback(err);

            return callback(null, featureDoc._id);
          });
        });
      }
    });
  }

  static delete(document, callback) {

    document.toDelete = true;
    this.findByIdAndUpdate(document._id.toString(), document, callback);
  }

  static undelete(document, callback) {

    delete document.toDelete;
    this.findByIdAndUpdate(document._id.toString(), document, callback);
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
