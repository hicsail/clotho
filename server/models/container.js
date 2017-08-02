'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Container extends MongoModels {
  static create(name, description, userId, callback) {

    const document = {
      name: name,
      description: description,
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


Container.collection = 'containers';

Container.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  type: Joi.string().valid('BEAKER', 'BOX', 'FLASK', 'FRIDGE', 'INCUBATOR', 'PLATE', 'RACK', 'TUBE', 'WELL'),
  parameterIds: Joi.array().items(Joi.string()),
  container: Joi.object(), // ?
  coordinates: Joi.array().items(Joi.number().integer())
});

Container.indexes = [
  {key: {userId: 1}}
];

module.exports = Container;

/*

 public void addCoordinate(Integer coordinate) {
 if (coordinates == null) {
 coordinates = new ArrayList<Integer>();
 }
 coordinates.add(coordinate);
 }

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
 */
