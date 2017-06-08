'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
// const Format = require('./format');
// const Assembly = require('./assembly');
const Sequence = require('./sequence');

class Part extends MongoModels {

  static create(name, description, sequence, userId, displayId, bioDesignId, callback) {

    const document = {
      name: name,
      description: description,
      sequence: sequence,
      userId: userId,
      displayId: displayId,
      bioDesignId: bioDesignId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }

  static findByBioDesignId(userId, callback) {

    const query = {'BioDesignId': BioDesignId};
    this.find(query, (err, part) => {

      if (err) {
        return callback(err);
      }

      this.getSequence(0, sequences, callback);
    });
  }

  //most likely one sequence only, may have to review this function
  static getSequence(index, part, callback) {

    if (index == part.length) {
      return callback(null, sequences);
    }

    Sequence.findByPartId(sequences[index]['_id'], (err, sequences) => {

      if (err) {
        callback(err, null);
      }

      if (sequences.length != 0) {
        part[index].sequences = sequences;
      }

      return this.getSequence(index + 1, part, callback);
    });
  }


}

// Original Java
//
// /**
//  * Change the Format of the Part
//  * @param format new Format for the Part
//  */
// public void setFormat(Format format) {
//   if (format.checkPart(this)) {
//     this.format = format;
//   }
// }
//
// public List<FeatureRole> getRoles() {
//   List<FeatureRole> roles = new LinkedList<FeatureRole>();
//   for (Annotation annotation : sequence.getAnnotations()) {
//     Feature feature = annotation.getFeature();
//     if (feature != null) {
//       roles.add(feature.getRole());
//     }
//   }
//   return roles;
// }
//
// public Assembly createAssembly() {
//   if (assemblies == null) {
//     assemblies = new ArrayList<Assembly>();
//   }
//   Assembly assembly = new Assembly();
//   assemblies.add(assembly);
//   return assembly;
// }
//
// public void addAssembly(Assembly assembly) {
//   if (assemblies == null) {
//     assemblies = new ArrayList<Assembly>();
//   }
//   assemblies.add(assembly);
// }


Part.collection = 'parts';

Part.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  sequence: Sequence.schema,
  userId: Joi.string().required(),
  displayId: Joi.string().optional(),
  bioDesignId: Joi.string()
});

Part.indexes = [
  {key: {userId: 1}}
];

module.exports = Part;
