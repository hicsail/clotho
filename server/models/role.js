'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Role extends MongoModels {
  static create(name, userId, callback) {

    const document = {
      name: name,
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


Role.collection = 'roles';

Role.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().uppercase().required(),
  userId: Joi.string().required()
});

Role.indexes = [
  {key: {userId: 1}}
];

module.exports = Role;
