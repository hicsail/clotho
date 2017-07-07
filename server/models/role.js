'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Role extends MongoModels {
  static create(name, userId, type, callback) {

    if (typeof name === 'string') {
      name = name.toUpperCase();
    }

    // Check if role already exists.
    this.findOne({name: name}, (err, results) => {

      if (err) {

        return callback(err);
      }

      if (results === null) {
        const document = {
          name: name,
          userId: userId,
          type: type
        };

        this.insertOne(document, (err, docs) => {

          if (err) {

            return callback(err);
          }

          callback(null, docs[0]);
        });
      } else {

        callback(Error('Role already exists.'));
      }

    });

  }

  // Check for whether role matches.
  static checkValidRole(role, callback) {

    if (role === undefined || role === null) {
      return callback(null, false);
    }


    this.findOne({name: role.toUpperCase()}, (err, results) => {

      if (err) {
        return callback(err);
      }

      return callback(null, err === null && results !== null);

    });

  }
}


Role.collection = 'roles';

Role.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().uppercase().required(),
  type: Joi.array().items(Joi.string().valid('MODULE', 'FEATURE')).default(['MODULE', 'FEATURE']),
  userId: Joi.string().required()
});

Role.indexes = [
  {key: {userId: 1}}
];

module.exports = Role;
