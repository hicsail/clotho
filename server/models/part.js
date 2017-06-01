'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Format = require('format');
const Assembly = require('assembly');
const Sequence = require('sequence');
const User = require('user');

class Part extends MongoModels {

  static create(name, sequence, author_id, callback) {
    return create(name, null, sequence, author_id, callback);
  }

  static create(name, description, sequence, author_id, callback) {
    const document = {
      name: name,
      description: description,
      sequence: sequence,
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
  format: Format.schema,
  assemblies: Joi.array().items(Assembly.schema),
  sequence: Sequence.schema,
  isForwardOrientation: Joi.boolean(),
  parentPart: Part.schema,
  name: Joi.string().required(),
  description: Joi.string(),
  author_id: Joi.string().required()
});

Part.indexes = [];

module.exports = Part;
