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


  static getParameterByBioDesignId(bioDesignIds, parameters, callback) {

    var query = {};
    if (typeof bioDesignIds == 'string') {
      query = {bioDesignId: bioDesignIds};
    } else {
      query = {bioDesignId: {$in: bioDesignIds}};
    }


    var parameterLabels = ['name', 'value', 'variable', 'units'];
    if (parameters !== null) {
      var parameterQueries = {'name': [], 'value': [], 'variable': [], 'units': []};
      for (let para of parameters) {
        if (para['value'] !== undefined && para['value'] !== null && !isNaN(para['value'])) {
          para['value'] = +para['value']; // convert to number
        }
        for (let p of parameterLabels) {
          if (para[p] !== undefined && para[p] !== null) {
            parameterQueries[p].push(para[p]);
          }
        }

      }

      for (let p of parameterLabels) {
        if (parameterQueries[p].length > 0) {
          query[p] = {$in: parameterQueries[p]};
        }
      }

    }

    this.find(query, (err, results) => {

      if (err) {
        return callback(err);
      }

      callback(err, results);
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
  unit: Joi.string().required(), // These should be updated.
  value: Joi.number().required(),
  variable: Joi.string().required() // This was originally a Variable object/a ShareableObjBase.
});

Parameter.indexes = [
  {key: {_id: 1}}
];

module.exports = Parameter;
