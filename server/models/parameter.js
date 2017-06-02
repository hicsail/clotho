'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Parameter extends MongoModels {

  static create(value, variable, callback) {

    const document = {
      value: value,
      variable: variable
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
  value: Joi.number(),
  variable: Joi.object(), // This was originally a Variable object/a ShareableObjBase.
  unit: Joi.string().allow(['m', 'cm', 'inches', 'in', 'feet', 'ft']), // These should be updated.
  derivation: Joi.object() // Not using file.
});

Parameter.indexes = [
  {key: {_id: 1}}
];

module.exports = Parameter;
