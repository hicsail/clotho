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
