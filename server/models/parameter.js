'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Underscore = require('underscore');

class Parameter extends MongoModels {

  static create(name, userId, bioDesignId, value, variable, units, callback) {

    const document = {
      name: name,
      userId: userId,
      bioDesignId: bioDesignId,
      value: value,
      variable: variable,
      units: units
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }

  // Can pass in biodesignids, parameters, or both.
  static getParameterByBioDesignId(bioDesignIds, parameters, callback) {

    var query = {};
    if (typeof bioDesignIds == 'string') {
      query = {bioDesignId: bioDesignIds};
    } else if (bioDesignIds.length > 0) {
      query = {bioDesignId: {$in: bioDesignIds}};
    }

    // No array, just look for bioDesignIds.
    if (parameters === null || parameters.length === 0) {
      this.find(query, (err, results) => {
        if (err) {
          callback(err);
        }

        return callback(err, results);
      });
    } else {

      var parameterLabels = ['name', 'value', 'variable', 'units'];

      var allPromises = [];

      // Loop through parameter objects passed in.

      for (let parameterObj of parameters) {

        // Perform find for given parameter object.
        var promise = new Promise((resolve, reject) => {
          query = {};
          // Initialize
          if (typeof bioDesignIds == 'string') {
            query.bioDesignId = bioDesignIds;
          } else if (bioDesignIds.length > 0) {
            // Combine list of biodesignIds.
            query.bioDesignIds = {$in: bioDesignIds};
          }
          // Reformat query so that name and variable have regex, value is cast to number.
          for (let label of parameterLabels) {
            if (parameterObj[label] !== undefined && parameterObj[label] !== null) {
              if (label === 'name' || label === 'variable') {
                query[label] = {$regex: parameterObj[label]};
              } else if (label === 'value' && !isNaN(parameterObj['value'])) {
                query[label] = +parameterObj['value'];
              } else if (label === 'units') {
                query[label] = parameterObj[label];
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

      // For multiple parameter searches, need to find intersection of matching parameter documents.
      Promise.all(allPromises).then((resolve, reject) => {
        if (resolve.length !== undefined && resolve.length !== null) {
          if (resolve.length > 1 && resolve.indexOf(null) === -1) {
            var foundBioDesignIds = [];
            // Loop through parameter queries to get list of biodesignids.
            for (var q = 0; q < resolve.length; q++) {
              foundBioDesignIds.push([]);
              for (var p = 0; p < resolve[q].length; p++) {
                foundBioDesignIds[q].push(resolve[q][p].bioDesignId);
              }
            }
            // Find the intersection of all BioDesignIds.
            var bioDesignIntersection = foundBioDesignIds[0];
            for (var p = 1; p < foundBioDesignIds.length; p++) {
              if (bioDesignIntersection.length === 0) break;
              bioDesignIntersection = Underscore.intersection(bioDesignIntersection, foundBioDesignIds[p]);
            }

            // Then obtain all unique Parameter documents that matched the biodesignIds in intersection.

            if (bioDesignIntersection.length === 0) return callback(null, []);

            var returnedParameters = []; // Parameter documents to return.
            var allParameters = [].concat.apply([], resolve);
            for (var p = 0; p < allParameters.length; p++) {
              if (bioDesignIntersection.indexOf(allParameters[p].bioDesignId) !== -1) {
                returnedParameters.push(allParameters[p]);
              }
            }

            return callback(null, Underscore.uniq(returnedParameters));


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


}


Parameter.collection = 'parameters';

Parameter.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  userId: Joi.string().required(),
  bioDesignId: Joi.string(),
  derivation: Joi.object(), // Not using Derivation model.
  units: Joi.string().required(), // These should be updated.
  value: Joi.number().required(),
  variable: Joi.string().required() // This was originally a Variable object/a ShareableObjBase.
});

Parameter.indexes = [
  {key: {_id: 1}}
];

module.exports = Parameter;
