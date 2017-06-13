'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Annotation = require('./annotation');

class Sequence extends MongoModels {

  static create(name, description, userId, displayId, featureId, partId, sequence, isLinear, isSingleStranded, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      displayId: displayId,
      featureId: featureId,
      partId: partId,
      sequence: sequence,
      isLinear: isLinear,
      isSingleStranded: isSingleStranded
    };

    this.insertOne(document,  (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[1]);
    });
  }

  static findByUserId(userId, callback) {

    const query = {'userId': userId};
    this.find(query, (err, sequences) => {

      if (err) {
        return callback(err);
      }

      this.getAnnotations(0,sequences,callback);
    });
  }

  static findByPartId(partId, callback) {

    const query = {partId: partId};
    this.find(query, (err, sequences) => {

      if (err) {
        return callback(err);
      }

      this.getAnnotations(0,sequences,callback);
    });
  }

  static getAnnotations(index,sequences,callback) {

    if(index == sequences.length){
      return callback(null, sequences);
    }

    Annotation.findBySequenceId(sequences[index]['_id'].toString(), (err,annotations) =>{

      if(err) {
        return callback(err,null);
      }

      if(annotations.length != 0) {
        sequences[index].annotations = annotations;
      }

      return this.getAnnotations(index + 1, sequences,callback);
    });
  }

  // Should these be moved to Annotation file?

  createAnnotation(name, description, start, end, isForwardStrand, userId) {

  }

  addAnnotation(annotation) {

  }

  // Original Java.
  /*
   public Annotation createAnnotation(String name, int start, int end, boolean isForwardStrand,
   Person author) {
   Annotation annotation = new Annotation(name, start, end, isForwardStrand, author);
   addAnnotation(annotation);
   return annotation;
   }

   public Annotation createAnnotation(String name, String description, int start, int end,
   boolean isForwardStrand, Person author) {
   Annotation annotation = new Annotation(name, description, start, end, isForwardStrand, author);
   addAnnotation(annotation);
   return annotation;
   }

   public void addAnnotation(Annotation annotation) {
   if (annotations == null) {
   annotations = new HashSet<Annotation>();
   }
   annotations.add(annotation);
   }

   */


}

Sequence.collection = 'sequences';

// Sequence and Polynucleotide as 1 object
Sequence.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string().optional(),
  userId: Joi.string().required(),
  displayId: Joi.string().optional(),
  partId: Joi.string().optional(),
  accession: Joi.string().optional(), // Polynucleotide-specific attributes start here.
  isLinear: Joi.boolean().optional(),
  isSingleStranded: Joi.boolean().optional(),
  sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/,'DNA sequence').insensitive(), // Case-insensitive.
  submissionDate: Joi.date() // also ignores parentPolynucleotideId
});


// Needs to be changed.
Sequence.indexes = [
  {key: {userId: 1}}
];

module.exports = Sequence;
