'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Sequence = require('./sequence');
const Part = require('./part');
const Parameter = require('./parameter');
const Module = require('./module');
const Underscore = require('underscore');
const Version = require('./version');


class BioDesign extends MongoModels {

  static create(name, description, userId, displayId, imageURL, subBioDesignIds, superBioDesignId, type, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      displayId: displayId,
      imageURL: imageURL,
      subBioDesignIds: subBioDesignIds,
      superBioDesignId: superBioDesignId,
      type: type
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      Version.create(
        userId,
        docs[0]['_id'],
        0, //versionNumber; set to zero initially, if updating, will be updated later.
        'bioDesign', //collectionName
        description,
        null,  //application
        (err, results) => {

          if (err) {
            return (err);
          }
          //callback(null  , docs[0])

        });
      callback(null, docs[0]);
    });
  }


  static getBioDesignIdsByQuery(bioDesignIds, query, callback) {

    if (query == null) {
      query = {};
    }

    var query2 = this.convertBD(bioDesignIds, query); //clean up query

    this.find(query2, (err, bioDesigns) => {

      if (err) {
        return callback(err);
      }
      return this.getIds(bioDesigns, callback)
    });
  }


  static getIds(bioDesigns, callback) {

    var bioDesignIds = [];

    if (bioDesigns.length > 0) {

      for (var i = 0; i < bioDesigns.length; ++i) {
        bioDesignIds.push(bioDesigns[i]['_id'])
      }
    }
    callback(null, bioDesignIds)
  }


    // Helper function to clean up query
  static convertBD(bioDesignIds, extra) {

    var query = {};

    if (typeof bioDesignIds !== 'string') {
      // Convert strings to mongo ids.
      for (var i = 0; i < bioDesignIds.length; ++i) {
        bioDesignIds[i] = new MongoModels.ObjectID(bioDesignIds[i].toString());
      }

      if (bioDesignIds.length > 0) {
        query = {_id: {$in: bioDesignIds}};
      }

    } else if (bioDesignIds !== undefined && bioDesignIds !== null) {
      query = {_id: new MongoModels.ObjectID(bioDesignIds)};
    }


    if (extra['name'] !== undefined) {
      query['name'] = {$regex: extra['name'], $options: 'i'};
    }

    if (extra['displayId'] !== undefined) {
      query['displayId'] = {$regex: extra['displayId'], $options: 'i'};
    }

    // Need to ensure all attributes from query are copied over.

    var extraAttributes = Object.keys(extra);
    for (var i = 0; i < extraAttributes.length; i++) {
      if (extraAttributes[i] !== 'name' && extraAttributes[i] !== 'displayId') {
        query[extraAttributes[i]] = extra[extraAttributes[i]];
      }
    }

    return query;
  }


  // Get complete device or part. If no subbiodesign exists, is treated as a part.
  // Accepts array of bioDesignIds or single string.

  // isDevice can be null to indicate that we need to query biodesign(s) to determine its type.
  static getBioDesignIds(bioDesignIds, query, isDevice, callback) {

    if (query == null) {
      query = {};
    }
    var query2 = this.convertBD(bioDesignIds, query); //clean up query


    this.find(query2, (err, bioDesigns) => {

      if (err) {
        return callback(err);
      }

      // otherwise buildup biodesign objects
      var allPromises = [];


      //for a list of entered bioDesign Ids
      for (var i = 0; i < bioDesigns.length; ++i) {
        // fetch aggregate of part, module, parameter (informally, components)
        // and combine with main biodesign object

        var promise = new Promise((resolve, reject) => {

          var isDeviceInput = isDevice;

          if (isDevice === null) {
            isDeviceInput = bioDesigns[i].type === 'DEVICE';
          }

          this.getBioDesign(bioDesigns[i]._id.toString(), isDeviceInput, (errGet, components) => {

            if (errGet) {
              reject(errGet);
            }

            resolve(components);
          });
        });
        allPromises.push(promise);
      }

      Promise.all(allPromises).then((resolve, reject) => {

        if (reject) {
          return callback(reject);
        }

        var subBioDesignsExist = 'False';

        for (var i = 0; i < bioDesigns.length; ++i) {
          bioDesigns[i]['subparts'] = resolve[i]['subparts'];
          bioDesigns[i]['modules'] = resolve[i]['modules'];
          bioDesigns[i]['parameters'] = resolve[i]['parameters'];

          if (bioDesigns[i].subBioDesignIds !== null && bioDesigns[i].subBioDesignIds.length !== 0) {
            //check if any subBioDesign exists
            subBioDesignsExist = 'True';
          }
        }

        if (subBioDesignsExist === 'False') { // if no subBioDesign exists, do not wait for subBioDesignPromises
          return callback(null, bioDesigns);
        }

        //else
        //starting with 1 bioDesign first
        this.getSubBioDesign(bioDesigns, bioDesignIds, (err, results) => {

          if (err) {
            return callback(err);
          }
          return callback(null, results);
        });

      });

    });
  }


  static getSubBioDesign(bioDesigns, bioDesignIds, callback) {

    var subBioDesignPromises = [];

    for (var i = 0; i < bioDesigns.length; ++i) {

      // Check if subBioDesigns exist
      //removed isDevice, check later
      if (bioDesigns[i].subBioDesignIds !== undefined && bioDesigns[i].subBioDesignIds !== null
        && bioDesigns[i].subBioDesignIds.length !== 0) {

        var subBioDesignPromise = new Promise((resolve, reject) => {

          this.getBioDesignIds(bioDesigns[i].subBioDesignIds, null, null, (errSub, components) => {

            if (errSub) {
              reject(errSub);
            }
            resolve(components);
          });
        });

        subBioDesignPromises.push(subBioDesignPromise);
      }
    }

    Promise.all(subBioDesignPromises).then((subresolve, subreject) => {

      if (subreject) {
        return callback(subreject);
      }

      for (var i = 0; i < bioDesigns.length; ++i) {
        bioDesigns[i]['subdesigns'] = subresolve[i];
      }

      return callback(null, bioDesigns);
    });

  }

// based on biodesignId, fetches all children
  static getBioDesign(bioDesignId, isDevice, callback) {

    Part.findByBioDesignId(bioDesignId, isDevice, (err, subparts) => {

      if (err) {
        return callback(err);
      }

      Module.findByBioDesignId(bioDesignId, (err, modules) => {

        if (err) {
          return callback(err);
        }

        Parameter.getParameterByBioDesignId(bioDesignId, [], (err, parameters) => {

          if (err) {
            return callback(err);
          }

          return callback(null, {subparts: subparts, modules: modules, parameters: parameters});
        });

      });

    });

  }


// Search for subdesigns.
  static getSubDesignByBioDesignId(bioDesignIds, subDesigns, callback) {

    var query = {};
    if (typeof bioDesignIds == 'string') {
      query = {superBioDesignId: bioDesignIds};
    } else if (bioDesignIds.length > 0) {
      query = {superBioDesignId: {$in: bioDesignIds}};
    }


    // No array, just look for bioDesignIds.
    if (subDesigns === null || subDesigns.length === 0) {
      this.find(query, (err, results) => {

        if (err) {
          callback(err);
        }

        return callback(err, results);
      });
    } else {

      var subDesignLabels = ['name', 'displayId', 'description', '_id'];
      var allPromises = [];

      // Loop through subDesign objects passed in.
      for (let subDesignObj of subDesigns) {

        // Perform find for given subDesign object.
        var promise = new Promise((resolve, reject) => {

          query = {};
          // Initialize
          if (typeof bioDesignIds == 'string') {
            query = {superBioDesignId: bioDesignIds};
          } else if (bioDesignIds.length > 0) {
            query = {superBioDesignId: {$in: bioDesignIds}};
          }
          // Reformat query so that name and variable have regex, value is cast to number.
          for (let label of subDesignLabels) {
            if (subDesignObj[label] !== undefined && subDesignObj[label] !== null) {
              if (label === 'name' || label === 'displayId' || label === 'description') {
                query[label] = {$regex: subDesignObj[label]};
              } else if (label === '_id') {
                query[label] = new MongoModels.ObjectID(subDesignObj[label]);
              }
            }
          }

          this.find(query, (errGet, results) => {

            if (errGet) {
              return reject(errGet);
            }

            if (results.length !== undefined && results.length !== null && results.length === 0) {
              resolve([]);
            }

            resolve(results);
          });
        });
        allPromises.push(promise);

      }

      // For multiple subDesign searches, need to find intersection of matching subDesign documents.
      Promise.all(allPromises).then((resolve, reject) => {

        if (resolve.length !== undefined && resolve.length !== null) {
          if (resolve.length > 1 && resolve.indexOf(null) === -1) {
            var foundBioDesignIds = [];
            // Loop through subDesign queries to get list of parent biodesignids.
            for (var i = 0; i < resolve.length; ++i) {
              foundBioDesignIds.push([]);
              for (var j = 0; j < resolve[i].length; ++j) {
                foundBioDesignIds[i].push(resolve[i][j].superBioDesignId);
              }
            }
            // Find the intersection of all BioDesignIds.
            var bioDesignIntersection = foundBioDesignIds[0];
            for (var foundBioDesign of foundBioDesignIds) {
              if (bioDesignIntersection.length === 0) break;
              bioDesignIntersection = Underscore.intersection(bioDesignIntersection, foundBioDesign);
            }

            if (bioDesignIntersection.length === 0) return callback(null, []);

            return callback(null, bioDesignIntersection);


          } else if (resolve.length === 1) {
            return callback(null, resolve[0]);
          } else if (resolve.length > 1 && resolve.indexOf(null) !== -1) {
            return callback(null, []);
          }
        }
        return callback(reject);
      });
    }
  }

  static delete(document, callback) {

    document.toDelete = true;
    this.findByIdAndUpdate(document._id.toString(), document, callback);
  }

}


BioDesign.collection = 'biodesigns';

BioDesign.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  displayId: Joi.string().optional(),
  moduleId: Joi.string(),
  mediaIds: Joi.array().items(Joi.string()),
  strainIds: Joi.array().items(Joi.string()),
  subBioDesignIds: Joi.array().items(Joi.string()),
  superBioDesignId: Joi.string().optional(),
  versionId: Joi.string().optional(),
  polynucleotides: Joi.array().items(Sequence.schema),
  type: Joi.string().uppercase().optional()
});

BioDesign.indexes = [
  {key: {userId: 1}}
];

module.exports = BioDesign;
