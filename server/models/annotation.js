'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
//const Feature = require('./feature');

class Annotation extends MongoModels {

  static create(sequenceId, name, description, start, end, isForwardStrand, userId, callback) {

    const document = {
      sequenceId: sequenceId,
      name: name,
      description: description,
      start: start,
      end: end,
      isForwardStrand: isForwardStrand,
      userId: userId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }

  static findBySequenceId(sequenceId, callback) {

    const query = {'sequenceId': sequenceId};
    this.find(query, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs);
    });
  }

// Original Java
//   /**
//    * Reverse the orientation of the annotation (reverse complement
//    * it and flip flop the start and end sites).  Called from NucSeq
//    * when it's reverse complemented
//    * @param seqLength
//    */
//   public void invert(int seqLength) {
//   isForwardStrand = !isForwardStrand;
//   int s = start;
//   start = seqLength - end;
//   end = seqLength - s;
// }
//
}


Annotation.collection = 'annotations';

// Does not include shareableobjbase properties.
Annotation.schema = Joi.object().keys({
  _id: Joi.object(),
  sequenceId: Joi.string().required(),
  symbol: Joi.string(),
  isForwardStrand: Joi.boolean().required(),
  //feature: Feature.schema,
  start: Joi.number().integer().positive().required(),
  end: Joi.number().integer().positive().required(),
  name: Joi.string().required(),
  userId: Joi.string().required(),
  description: Joi.string()
});

Annotation.indexes = [
  {key: {userId: 1}}
];

module.exports = Annotation;
