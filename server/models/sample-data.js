'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class SampleData extends MongoModels {
  static create(name, description, userId, sampleId, responseVariables, instrument, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      sampleId: sampleId,
      responseVariables: responseVariables,
      instrument: instrument
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}


SampleData.collection = 'sampleData';

SampleData.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  parameterIds: Joi.array().items(Joi.string()),
  sampleId: Joi.string().required(),
  responseVariables: Joi.array().items(Joi.object()),
  instrument: Joi.object()
});

SampleData.indexes = [
  {key: {userId: 1}}
];

module.exports = SampleData;


//
// public Parameter createParameter(double value, Variable variable) {
//   Parameter parameter = new Parameter(value, variable);
//   addParameter(parameter);
//   return parameter;
// }
//
// public void addParameter(Parameter parameter) {
//   if (parameters == null) {
//     parameters = new HashSet<Parameter>();
//   }
//   parameters.add(parameter);
// }
