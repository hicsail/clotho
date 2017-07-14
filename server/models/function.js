'use strict';
const Joi = require('joi');
const MongoModels = require('mongo-models');


class Function extends MongoModels {
  static create(name, description, userId, language, code, inputs, outputs, working, callback) {

    const document = {
      name:name,
      description:description,
      userId:userId,
      language:language,
      code: code,
      inputs:inputs,
      outputs:outputs,
      working:working,
      timeCreated: new Date()
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  }

  static findByName(name, callback) {

    const query = {'name': name.toLowerCase()};

    this.findOne(query, callback);
  }
}


Function.collection = 'functions';


Function.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string(),
  description: Joi.string(),
  userId: Joi.string(),
  language: Joi.string(),
  code: Joi.string(),
  inputs: Joi.array(),
  outputs: Joi.array(),
  working: Joi.boolean(),
  timeCreated: Joi.date()
});


Function.indexes = [
  {key: {'name': 1}}
];


module.exports = Function;
