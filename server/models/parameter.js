'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Parameter extends MongoModels {

  static create(userId, bioDesignId, value, variable, callback) {

    const document = {
      userId: userId,
      bioDesignId: bioDesignId,
      value: value,
      variable: variable,
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }


  static getParameterByBioDesignId(bioDesignIds, parameters, callback) {

    var query = {bioDesignId: {$in: bioDesignIds}};
    if (parameters !== null) {
      var parameterValues = [], parameterVariables = [];
      for (var para of parameters) {
        if (!isNaN(para['value'])) {
          para['value'] = +para['value']; // convert to number
        }
        parameterValues.push(para['value']);
        parameterVariables.push(para['variable']);
      }

      query['value'] = {$in: parameterValues};
      query['variable'] = {$in: parameterVariables};

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
  bioDesignId: Joi.string(),
  derivation: Joi.object(), // Not using Derivation model.
  unit: Joi.string().allow(['m', 'cm', 'inches', 'in', 'nm']), // These should be updated.
  value: Joi.number().required(),
  variable: Joi.string().required(), // This was originally a Variable object/a ShareableObjBase.
  userId: Joi.string().required()
});

Parameter.indexes = [
  {key: {_id: 1}}
];

module.exports = Parameter;
