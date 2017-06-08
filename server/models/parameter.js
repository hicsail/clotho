'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Parameter extends MongoModels {

  static create(value, variable, bioDesignId, callback) {

    const document = {
      value: value,
      variable: variable,
      bioDesignId: bioDesignId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}


Parameter.collection = 'parameters';

Parameter.schema = Joi.object().keys({
  _id: Joi.object(),
  value: Joi.number().required(),
  variable: Joi.object().required(), // This was originally a Variable object/a ShareableObjBase.
  unit: Joi.string().allow(['m', 'cm', 'inches', 'in', 'nm']), // These should be updated.
  derivation: Joi.object(), // Not using Derivation model.
  bioDesignId: Joi.string()
});

Parameter.indexes = [
  {key: {_id: 1}}
];

module.exports = Parameter;
