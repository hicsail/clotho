'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

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
    }


    var parameterLabels = ['name', 'value', 'variable', 'units'];

    var allPromises = [];

    for (let parameterObj of parameters) {

      // Reset query.
      if (typeof bioDesignIds == 'string') {
        query = {bioDesignId: bioDesignIds};
      } else if (bioDesignIds.length > 0) {
        query = {bioDesignId: {$in: bioDesignIds}};
      }

      // Reformat query so that name and variable have regex, value is cast to number.
      for (let label of parameterLabels) {
        if (parameterObj[label] !== undefined && parameterObj[label] !== null) {
          if (label == 'name' || label == 'variable') {
            query[label] = {$regex: parameterObj[label]};
          } else if (label === 'value' && !isNaN(parameterObj['value'])) {
            query[label] = +parameterObj['value'];
          } else if (label === 'units') {
            query[label] = parameterObj[label];
          }
        }
      }

      // Perform find for given parameter.
      var promise = new Promise((resolve, reject) => {

        this.find(query, (errGet, results) => {


          if (errGet) {
            return callback(reject(errGet));
          }


          // If any one of the parameters doesn't match, don't perform any more finds.

          if (results.length !== undefined && results.length !== null && results.length === 0) {
            return callback(null, results);
          }
          resolve(results);
        });
      });
      allPromises.push(promise);

    }

    // For multiple parameter searches.
    Promise.all(allPromises).then((resolve, reject) => {
      if (resolve.length !== undefined && resolve.length !== null) {
        if (resolve.length > 1) {
          return callback(null, [].concat.apply([], resolve));
        } else if (resolve.length === 1) {
          return callback(null, resolve[0]);
        }
      }
      return callback(reject);
    });


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
