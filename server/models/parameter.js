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


  static getByParameter(parameters, callback) {

    const query = parameters[0];
    this.find(query, (err, parameters) => {

      if (err) {
        return callback(err);
      }
      this.getBioDesignIdsbyParameter(parameters, callback)
    });

  }

  static getBioDesignIdsbyParameter(parameters, callback) {
    var bioDesignIds = [];

    if (parameters.length > 0) {

      for (var i = 0; i < parameters.length; ++i) {
        bioDesignIds.push(parameters[i]['bioDesignId'])
      }
    }
    callback(null, bioDesignIds)

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
          return callback(err);
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
            query.bioDesignId = {$in: bioDesignIds};
          }
          // Reformat query so that name and variable have regex, value is cast to number.
          for (let label of parameterLabels) {
            if (parameterObj[label] !== undefined && parameterObj[label] !== null) {
              if (label === 'name' || label === 'variable' || label == 'units') {
                query[label] = {$regex: parameterObj[label]};
              } else if (label === 'value' && !isNaN(parameterObj['value'])) {
                query[label] = +parameterObj['value'];
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
            for (var i = 0; i < resolve.length; ++i) {
              foundBioDesignIds.push([]);
              for (var j = 0; j < resolve[i].length; ++j) {
                foundBioDesignIds[i].push(resolve[i][j].bioDesignId);
              }
            }
            // Find the intersection of all BioDesignIds.
            var bioDesignIntersection = foundBioDesignIds[0];
            for (i = 1; i < foundBioDesignIds.length; ++i) {
              if (bioDesignIntersection.length === 0) break;
              bioDesignIntersection = Underscore.intersection(bioDesignIntersection, foundBioDesignIds[i]);
            }

            // Then obtain all unique Parameter documents that matched the biodesignIds in intersection.

            if (bioDesignIntersection.length === 0) return callback(null, []);

            var returnedParameters = []; // Parameter documents to return.
            var allParameters = [].concat.apply([], resolve);
            for (let parameter of allParameters) {
              if (bioDesignIntersection.indexOf(parameter.bioDesignId) !== -1) {
                returnedParameters.push(parameter);
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
      })
        .catch((error) => {

          return callback(error, null);
        });
    }
  }

  static delete(document, callback) {

    document.toDelete = true;
    this.findByIdAndUpdate(document._id.toString(), document, callback);
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
