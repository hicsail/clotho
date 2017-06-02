'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class CompositeModule extends MongoModels {

  static create(name, description, role, submoduleIds, userId, callback) {

    const document = {
      name: name,
      description: description,
      role: role,
      submoduleIds: submoduleIds,
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


CompositeModule.collection = 'compositemodules';

CompositeModule.schema = Joi.object().keys({
  _id: Joi.object(),
  submoduleIds: Joi.array().items(Joi.string()),
  name: Joi.string().required(),
  userId: Joi.string().required(),
  description: Joi.string(),
  role: Joi.string().valid('TRANSCRIPTION', 'TRANSLATION', 'EXPRESSION', 'COMPARTMENTALIZATION', 'LOCALIZATION', 'SENSOR', 'REPORTER', 'ACTIVATION', 'REPRESSION').required()
});

CompositeModule.indexes = [
  {key: {userId: 1}}
];

module.exports = CompositeModule;
