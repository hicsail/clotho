'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Influence = require('./influence');

class Module extends MongoModels {
  static create(name, role, author_id, callback) {
    return create(name, null, role, author_id, callback);
  }

  static create(name, description, role, author_id, callback) {
    const document = {
      name: name,
      description: description,
      role: role,
      author_id: author_id
    };

    this.insertOne(document, (err, docs) => {
      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}

//
// public void addInfluence(Influence influence) {
//   if (influences == null) {
//     influences = new HashSet<Influence>();
//   }
//   influences.add(influence);
// }



Module.collection = 'modules';

Module.schema = Joi.object().keys({
  _id: Joi.object(),
  role: Joi.string().regex(/^TRANSCRIPTION|TRANSLATION|EXPRESSION|COMPARTMENTALIZATION|LOCALIZATION|SENSOR|REPORTER|ACTIVATION|REPRESSION$/).required(),
  name: Joi.string().required(),
  description: Joi.string(),
  author_id: Joi.string().required(),
  influences: Influence.schema(),
  parentModule: Joi.string()
});

Module.indexes = [];

module.exports = Module;
