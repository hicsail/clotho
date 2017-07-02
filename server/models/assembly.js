'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Assembly extends MongoModels {

  static create(subBioDesignIds, partIds, userId, callback) {

    const document = {
      subBioDesignIds: subBioDesignIds,
      partIds: partIds,
      userId: userId
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
  subBioDesignIds: Joi.array().items(Joi.string()),
  partIds: Joi.array().items(Joi.string()),
  _id: Joi.object()
});

// @Getter
// @Setter
// @ReferenceCollection
// protected List<Part> parts;
//
// @Getter
// protected List<Assembly> subAssemblies;

Assembly.indexes = [
  {key: {_id: 1}}
];

module.exports = Assembly;
