'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const BioDesign = require('./bio-design');

class ExperimentDesign extends MongoModels {
  static create(name, description, responseVariables, controlledVariables, userId, callback) {

    const document = {
      name: name,
      description: description,
      responseVariables: responseVariables,
      controlledVariables: controlledVariables,
      userId: userId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}


ExperimentDesign.collection = 'experimentDesigns';

ExperimentDesign.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  responseVariables: Joi.array().items(Joi.string()).required(),
  controlledVariables: Joi.array().items(Joi.string()).required(),
  userId: Joi.string().required(),
  experimentalConditionIds: Joi.array().items(Joi.string()),
  bioDesign: BioDesign.schema,
  subDesignIds: Joi.array().items(Joi.string()),
  parentDesignId: Joi.string()
});

ExperimentDesign.indexes = [];

module.exports = ExperimentDesign;

/*
 public ExperimentalCondition createExperimentalCondition() {
 ExperimentalCondition experimentalCondition = new ExperimentalCondition();
 addExperimentalCondition(experimentalCondition);
 return experimentalCondition;
 }

 public void addExperimentalCondition(ExperimentalCondition experimentalCondition) {
 if (experimentalConditions == null) {
 experimentalConditions = new HashSet<ExperimentalCondition>();
 }
 experimentalConditions.add(experimentalCondition);
 }

 public void addSubDesign(ExperimentalDesign subDesign) {
 if (subDesigns == null) {
 subDesigns = new HashSet<ExperimentalDesign>();
 }
 subDesigns.add(subDesign);
 }

 public void addResponseVariable(String responseVariable) {
 if (responseVariables == null) {
 responseVariables = new HashSet<String>();
 }
 responseVariables.add(responseVariable);
 }

 public void addControlledVariable(String controlledVariable) {
 if (controlledVariables == null) {
 controlledVariables = new HashSet<String>();
 }
 controlledVariables.add(controlledVariable);
 }

 */
