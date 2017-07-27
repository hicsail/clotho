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

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      else {
        callback(null, docs[0]);
      }
    });
  }

  static getSequenceBySequenceString(seq, callback) {

    const query = {sequence: seq};
    this.find(query, (err, sequences) => {

      if (err) {
        return callback(err);
      }

      this.getAnnotations(0, sequences, callback);

    });
  }

  static findByUserId(userId, callback) {

    const query = {userId: userId};
    this.find(query, (err, sequences) => {

      if (err) {
        return callback(err);
      }

      this.getAnnotations(0, sequences, callback);
    });
  }

  static findByPartId(partId, callback) {

    const query = {partId: partId};
    this.find(query, (err, sequences) => {

      if (err) {
        return callback(err);
      }

      return this.getChild(0, sequences, callback);

    });
  }


  static findByPartIdOnly(i, partId, callback) {

    const query = {partId: partId.toString()};
    this.find(query, (err, sequences) => {

      if (err) {
        return callback(err);
      }
      callback(null, [i, sequences]);

    });

  }

//get subAnnotations if they exist, then direct to getAnnotations
  static getChild(index, sequences, callback) {

    this.getSubAnnotations(index, sequences, (err, seqWithSubAnnotations) => {

      if (err) {
        return callback(err);
      }

      if (seqWithSubAnnotations !== undefined) { //if there is subannotations
        return this.getAnnotations(index, seqWithSubAnnotations, callback);
      }

      else { //if there is no assembly
        return this.getAnnotations(index, sequences, callback);
      }
    });
  }


  static getAnnotations(index, sequences, callback) {

    if (index == sequences.length) {
      return callback(null, sequences);
    }

    Annotation.findBySequenceId(sequences[index]['_id'].toString(), (err, annotations) => {

      if (err) {
        return callback(err, null);
      }

      if (annotations.length != 0) {
        sequences[index].annotations = annotations;
      }

      return this.getAnnotations(index + 1, sequences, callback);
    });
  }


  // Find subannotations (in case of being sequence in a device.)
  static getSubAnnotations(index, sequences, callback) {

    if (index == sequences.length) {
      return callback(null, sequences);
    }

    Annotation.findBySuperSequenceId(sequences[index]['_id'].toString(), (err, subannotations) => {

      if (err) {
        return callback(err, null);
      }


      if (subannotations.length != 0) {
        sequences[index].subannotations = subannotations;
      }

      return this.getSubAnnotations(index + 1, sequences, callback);
    });
  }

  // Find annotations given a list of sequence ids (for device interaction with subparts)
  static getSubSubAnnotations(index, sequences, callback) {

    if (index == sequences.length) {
      return callback(null, sequences);
    }

    Annotation.findBySuperSequenceId(sequences[index].toString(), (err, subannotations) => {

      if (err) {
        return callback(err, null);
      }

      if (subannotations.length != 0) {
        sequences[index].subannotations = subannotations;

      }

      return this.getSubSubAnnotations(index + 1, sequences, callback);
    });
  }


  // Creates Sequence and Annotation if non-existent. Otherwise updates sequence.
  static updateSequenceByBioDesign(bioDesignId, name, displayId, userId, sequence, callback) {

    var partId;
    this.findOne({'bioDesignId': bioDesignId}, (err, results) => {

      if (err) {
        return callback(err);
      }

      // No associated sequence, need to create a sequence.
      if (results === null || results.length === 0) {

        // Find parts that correspond to biodesign.

        const Part = require('./part');

        Part.find({'bioDesignId': bioDesignId}, (err, subpart) => {

          if (err) {
            return callback(err);
          }

          // May need to create a new subpart, along with sequence and annotation.
          if (subpart.length === 0) {
            Part.create(name, null, userId, displayId, bioDesignId,
              (err, results) => {

                if (err) {
                  return callback(err);
                } else {

                  partId = results;

                  // null parameters include description, featureId, and
                  this.create(name, null, userId, displayId, null, partId, sequence, null, null, (err, sequenceId) => {

                    if (err) return callback(err);

                    // null parameters include description,
                    Annotation.create(name, null, userId, sequenceId, 1, sequence.length, true, callback);

                  });
                }
              });
          } else {

            // Subpart already exists. Just need to create sequence and associated annotation.
            partId = subpart[0]._id.toString();

            this.create(name, null, userId, displayId, null, partId, sequence, null, null, (err, sequenceId) => {

              if (err) return callback(err);

              Annotation.create(name, null, userId, sequenceId, 1, sequence.length, true, callback);

            });

          }
        });

      } else {
        // Sequence exists, update annotation and sequence.
        this.updateOne({'bioDesignId': bioDesignId}, {$set: {sequence: sequence}}, (err, count, sequenceDoc) => {

          if (err) return callback(err);

          Annotation.updateOne({'bioDesignId': bioDesignId}, {
            $set: {
              start: 1,
              end: sequence.length
            }
          }, (err, count, annotationDoc) => {

            if (err) return callback(err);

            return callback(null, annotationDoc._id);

          });
        });
      }
    });
  }

  static delete(document, callback) {

    document.toDelete = true;
    this.findByIdAndUpdate(document._id.toString(), document, callback);
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
  featureId: Joi.string().optional(),
  partId: Joi.string().optional(),
  accession: Joi.string().optional(), // Polynucleotide-specific attributes start here.
  isLinear: Joi.boolean().optional(),
  isSingleStranded: Joi.boolean().optional(),
  sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive(), // Case-insensitive.
  submissionDate: Joi.date() // also ignores parentPolynucleotideId
});


// Needs to be changed.
Sequence.indexes = [
  {key: {userId: 1}}
];

module.exports = Sequence;
