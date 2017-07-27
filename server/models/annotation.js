'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Feature = require('./feature');

class Annotation extends MongoModels {

  static create(name, description, userId, sequenceId, superSequenceId, start, end, isForwardStrand, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      sequenceId: sequenceId,
      superSequenceId: superSequenceId, //used to indicate that annotations are connection from device sequence to part features
      start: start,
      end: end,
      isForwardStrand: isForwardStrand
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      else {
        callback(null, docs[0]);
      }
    });
  }

  static createWithIndex(i, name, description, userId, sequenceId, superSequenceId, start, end, isForwardStrand, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      sequenceId: sequenceId,
      superSequenceId: superSequenceId,
      start: start,
      end: end,
      isForwardStrand: isForwardStrand
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      else {
        callback(null, [i, docs[0]]);
      }
    });
  }


  // Retrieve annotation and get feature underneath.
  static findBySequenceId(sequenceId, callback) {

    const query = {'sequenceId': sequenceId};
    this.find(query, (err, annotations) => {

      if (err) {
        return callback(err);
      }

      return this.getFeatures(0, annotations, callback);
    });
  }


  // Retrieve annotation and get feature underneath.
  static findBySuperSequenceId(sequenceId, callback) {

    const query = {'superSequenceId': sequenceId};
    this.find(query, (err, annotations) => {

      if (err) {
        return callback(err);
      }

      this.getSubFeatures(0, annotations, callback);
    });
  }

  // Retrieve feature of a superannotationId.
  static getSubFeatures(index, annotations, callback) {

    if (index == annotations.length) {
      return callback(null, annotations);
    }

    Feature.findBySuperAnnotationId(annotations[index]['_id'].toString(), (err, features) => {

      if (err) {
        return callback(err, null);
      }

      if (features.length != 0) {
        annotations[index].subfeatures = features;
      }

      return this.getSubFeatures(index + 1, annotations, callback);
    });
  }


  // Get top level feature.
  static getFeatures(index, annotations, callback) {

    if (index == annotations.length) {
      return callback(null, annotations);
    }

    Feature.findByAnnotationId(annotations[index]['_id'].toString(), (err, features) => {

      if (err) {
        return callback(err, null);
      }

      if (features.length != 0) {
        annotations[index].features = features;
      }

      return this.getFeatures(index + 1, annotations, callback);
    });
  }

  
  static delete(document, callback) {

    document.toDelete = true;
    this.findByIdAndUpdate(document._id.toString(), document, callback);
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
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  sequenceId: Joi.string().required(),
  start: Joi.number().integer().positive().required(),
  end: Joi.number().integer().positive().required(),
  isForwardStrand: Joi.boolean().required()
});

Annotation.indexes = [
  {key: {userId: 1}}
];

module.exports = Annotation;
