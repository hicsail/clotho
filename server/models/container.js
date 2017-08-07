'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Parameter = require('./parameter');

class Container extends MongoModels {
  static create(name, description, userId, parameterIds, type, coordinates, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      parameterIds: parameterIds,
      type: type,
      coordinates: coordinates
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }

  static delete(document, callback) {

    document.toDelete = true;
    this.findByIdAndUpdate(document._id.toString(), document, callback);
  }
}


Container.collection = 'containers';

Container.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string().optional(),
  type: Joi.string().valid('BEAKER', 'BOX', 'FLASK', 'FRIDGE', 'INCUBATOR', 'PLATE', 'RACK', 'TUBE', 'WELL'),
  parameterIds: Joi.array().items(Joi.string()),
  coordinates: Joi.array().items(Joi.number())
});

Container.payload = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  type: Joi.string().valid('BEAKER', 'BOX', 'FLASK', 'FRIDGE', 'INCUBATOR', 'PLATE', 'RACK', 'TUBE', 'WELL').optional(),
  parameters: Joi.array().items(Parameter.payload).optional(),
  coordinates: Joi.array().items(Joi.number()).optional()
});

Container.indexes = [
  {key: {userId: 1}}
];

module.exports = Container;
