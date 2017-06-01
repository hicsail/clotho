'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Part = require('./part');

class Assembly extends MongoModels {

  static create(callback) {

    const document = {
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}

// public Assembly createSubAssembly() {
//   Assembly subAssembly = new Assembly();
//   addSubAssembly(subAssembly);
//   return subAssembly;
// }
//
// public void addPart(Part part) {
//   if (parts == null) {
//     parts = new ArrayList<Part>();
//   }
//   parts.add(part);
// }
//
// public void addSubAssembly(Assembly subAssembly) {
//   if (subAssemblies == null) {
//     subAssemblies = new ArrayList<Assembly>();
//   }
//   subAssemblies.add(subAssembly);
// }


Assembly.collection = 'assemblies';

Assembly.schema = Joi.object().keys({
  _id: Joi.object(),
  parts: Joi.array().items(Part.schema),
  subAssemblies: Joi.array().items(Joi.string())
});

// @Getter
// @Setter
// @ReferenceCollection
// protected List<Part> parts;
//
// @Getter
// protected List<Assembly> subAssemblies;

Assembly.indexes = [];

module.exports = Assembly;
