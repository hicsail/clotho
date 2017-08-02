'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Sample extends MongoModels {
  static create(name, description, userId, containerId, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      containerId: containerId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}


Sample.collection = 'samples';

Sample.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  bioDesignId: Joi.string(),
  parameterIds: Joi.array().items(Joi.string()),
  containerId: Joi.string().required(),
  parentSampleIds: Joi.array().items(Joi.string())
});

Sample.indexes = [
  {key: {userId: 1}}
];

module.exports = Sample;


/*
 public Parameter createParameter(double value, Variable variable) {
 Parameter parameter = new Parameter(value, variable);
 addParameter(parameter);
 return parameter;
 }

 public void addParameter(Parameter parameter) {
 if (parameters == null) {
 parameters = new HashSet<Parameter>();
 }
 parameters.add(parameter);
 }

 public void addParentSample(Sample parentSample) {
 if (parentSamples == null) {
 parentSamples = new HashSet<Sample>();
 }
 parentSamples.add(parentSample);
 }
 */
