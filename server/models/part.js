'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Sequence = require('./sequence');

class Part extends MongoModels {

  static create(name, description, userId, displayId, bioDesignId, callback) {

    const document = {
      name: name,
      description: description,
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

  // helper method for strings query
  static getParts(partIds, callback) {

    for (var i = 0; i < partIds.length; ++i) {
      partIds[i] = new MongoModels.ObjectID(partIds[i]);
    }

    const query = {_id: {$in: partIds}};

    this.find(query, (err, partIds) => {

      if (err) {
        return callback(err);
      }
      callback(null, partIds);
    });
  }


  static findByBioDesignId(bioDesignId, isDevice, callback) {

    if (bioDesignId == null) {
      bioDesignId = {};
    }

    var query = [];
    var partIds = [];

    // When passing in multiple biodesigns.
    if (typeof bioDesignId !== 'string') {

      if (bioDesignId.length > 0) {

        var allPromises = [];
        for (var i = 0; i < bioDesignId.length; ++i) {

          query.push({bioDesignId: bioDesignId[i]});

          var promise = new Promise((resolve, reject) => {

            // Find subparts.
            this.find(query[i], (err, part) => {

              if (err) {
                return callback(err);
              }
              partIds.push({'_id': part[0]['_id'].toString()});
              resolve(partIds);
            });
          });
          allPromises.push(promise);
        }
        Promise.all(allPromises).then((resolve, reject) => {

          this.getChildren(0, partIds, isDevice, callback);
        });
      }

      // When passing in only one biodesign.
    } else if (bioDesignId !== undefined && bioDesignId !== null) {
      query[0] = {bioDesignId: bioDesignId};

      this.find(query[0], (err, parts) => {

        if (err) {
          return callback(err);
        }
        return this.getChild(0, parts, isDevice, callback);
      });
    }
  }

//return only part
  static findByBioDesignIdOnly(i, bioDesignId, callback) {

    var query = [];

    if (bioDesignId !== undefined && bioDesignId !== null) {
      query[0] = {bioDesignId: bioDesignId};

      this.find(query[0], (err, parts) => {

        if (err) {
          return callback(err);
        }

        callback(null, [i, parts]);
      });
    }
  }

  // Get sequence and assemblies under the subpart.
  static getChild(index, parts, isDevice, callback) {

    //get Assembly
    this.getAssembly(index, parts, (err, partWithSeq) => {

      if (err) {
        return callback(err);
      }
      if (partWithSeq !== undefined) { //if there is an assembly
        // Get Sequence
        return this.getSequence(index, partWithSeq, callback);
      }
      else { //if there is no assembly
        return this.getSequence(index, parts, callback);
      }
    });
  }


  // Get sequence and assemblies under the subpart.
  static getChildren(index, parts, isDevice, callback) {

    if (parts !== undefined && index === parts.length) {
      return callback(null, parts);
    }

    // Get Sequence
    this.getSequence(index, parts, (err, partsWithSeq) => {

      if (err) {
        return callback(err);
      }

      // Then get assembly if needed.
      if (isDevice && partsWithSeq[index] !== undefined) {

        this.getAssembly(index, partsWithSeq, (err, partsWithAssembly) => {

          if (err) {
            return callback(err);
          }
          // this.getChildren(index + 1, partsWithAssembly, isDevice, callback);

        });
      } else {

        // Get assembly/sequence for next subpart.
        this.getChildren(index + 1, partsWithSeq, isDevice, callback);
      }
    });
  }

  //most likely one sequence only, may have to review this function
  static getSequence(index, parts, callback) {

    if (index == parts.length) {
      return callback(null, parts);
    }
    
    Sequence.findByPartId(parts[index]['_id'].toString(), (err, sequences) => {

      if (err) {
        return callback(err, null);
      }

      if (sequences.length != 0) {
        parts[index].sequences = sequences;
      }

      return this.getSequence(index + 1, parts, callback);
    });
  }

  // Given master subparts, find assembly.
  static getAssembly(index, parts, callback) {

    if (index == parts.length) {
      return callback(null, parts);
    }

    const Assembly = require('./assembly');

    Assembly.findByPartIdOnly(parts[index]['_id'].toString(), (err, assemblies) => {
      //use the function 'findByPartId' to get full subBioDesigns under assembly as well,
      // full subBioDesigns already called under subBioDesigns

      if (err) {
        return callback(err, null);
      }

      if (assemblies.length != 0) {
        parts[index].assemblies = assemblies;
      }

      return this.getAssembly(index + 1, parts, callback);
    });
  }

  // Given assemblyId, retrieve subparts under it.
  static findByAssemblyId(assemblyId, callback) {

    const query = {assemblyId: assemblyId};
    this.find(query, (err, subparts) => {

      if (err) {
        return callback(err);
      }


      this.getChildren(0, subparts, false, callback);

      // for (var i = 0; i < subparts.length; i++) {
      //   var promise = new Promise((resolve, reject) => {
      //     this.getChildren(0, subparts, false, (err, results) => {
      //       if (err) {
      //         reject(err);
      //       } else {
      //         resolve(results);
      //       }
      //     });
      //   });
      //   allPromises.push(promise);
      // }
      //
      // Promise.all(allPromises).then((resolve, reject) => {
      //   if (!reject) {
      //     return callback(null, resolve);
      //   } else {
      //     return callback(reject);
      //   }
      // });

    });
  }

  static delete(document, callback) {

    document.toDelete = true;
    this.findByIdAndUpdate(document._id.toString(), document, callback);
  }

}


Part.collection = 'parts';

Part.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  displayId: Joi.string().optional(),
  bioDesignId: Joi.string(),
  sequenceId: Joi.string(),
  assemblyId: Joi.string()
});

Part.indexes = [
  {key: {userId: 1}}
];

module.exports = Part;
