'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
// const Annotation = require('./annotation');

class Sequence extends MongoModels {

  static create(name, description, sequence, userId, callback) {

    const document = {
      name: name,
      description: description,
      sequence: sequence,
      userId: userId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
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

Sequence.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string().optional(),
  sequence: Joi.string().valid('A', 'T', 'U', 'C', 'G', 'R', 'Y', 'K', 'M', 'S', 'W', 'B', 'D', 'H', 'V', 'N').insensitive(), // Case-insensitive.
  userId: Joi.string().required(),
  annotationIds: Joi.array().items(Joi.string()), /*Joi.array().items(Annotation.schema),*/
  parentSequenceId: Joi.string(),
  icon: Joi.string() // In SharableObjBase.
});


// Needs to be changed.
Sequence.indexes = [
  {key: {userId: 1}}
];

module.exports = Sequence;
