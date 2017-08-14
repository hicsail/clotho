'use strict';
const Joi = require('joi');
const MongoModels = require('mongo-models');


class Application extends MongoModels {
  static create(name, description, userId, imageURL, website, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      imageURL: imageURL,
      website: website,
      time: new Date()
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }

      callback(null, docs[0]);
    });
  }
}


Application.collection = 'applications';


Application.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  userId: Joi.string().required(),
  imageURL: Joi.string().required(),
  website: Joi.string().required()
});


Application.indexes = [
  {key: {name: 1}},
];


module.exports = Application;
