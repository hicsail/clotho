'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Assembly extends MongoModels {

  static create(subBioDesignIds, userId, masterSubPartIds, callback) {

    const document = {
      subBioDesignIds: subBioDesignIds,
      userId: userId,
      masterSubPartIds: masterSubPartIds
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
  userId: Joi.string(),
  subBioDesignIds: Joi.array().items(Joi.string()),
  masterSubPartIds: Joi.array().items(Joi.string())
});

// @Getter
// @Setter
// @ReferenceCollection
// protected List<Part> parts;
//
// @Getter
// protected List<Assembly> subAssemblies;

Assembly.indexes = [
  {key: {userId: 1}}
];

module.exports = Assembly;
