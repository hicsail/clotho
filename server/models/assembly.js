'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Part = require('./part');

class Assembly extends MongoModels {

  static create(subBioDesignIds, userId, superSubPartId, callback) {

    const document = {
      subBioDesignIds: subBioDesignIds,
      userId: userId,
      superSubPartId: superSubPartId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }


  // Given master id, search.
  static findByPartId(partId, callback) {

    const query = {superSubPartId: partId};

    this.find(query, (err, assemblies) => {

      if (err) {
        return callback(err);
      }

      this.getSubParts(0, assemblies, callback);
    });
  }


  static findByPartIdOnly(partId, callback) {

    const query = {superSubPartId: partId};

    return this.find(query, callback);
  }

  // Get subparts that are under the assembly.
  static getSubParts(index, assemblies, callback) {

    if (index == assemblies.length) {
      return callback(null, assemblies);
    }

    Part.findByAssemblyId(assemblies[index]['_id'].toString(), (err, subBioDesignSubParts) => {

      if (err) {
        return callback(err);
      }

      if (subBioDesignSubParts.length != 0) {
        assemblies[index].subBioDesignSubParts = subBioDesignSubParts;
      }

      return this.getSubParts(index + 1, assemblies, callback);
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
  superSubPartId: Joi.string()
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
