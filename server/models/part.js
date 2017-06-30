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

    for (var i = 0; i < partIds.length; ++i)  {
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

  static findByBioDesignId(bioDesignId, callback) {

    if (bioDesignId == null) {
      bioDesignId = {};
    }

    var query = [];
    var partIds = [];


    if (typeof bioDesignId !== 'string') {

      if (bioDesignId.length > 0) {

        var allPromises = [];
        for (var i = 0; i < bioDesignId.length; ++i) {

          query.push({bioDesignId: bioDesignId[i]})

          var promise = new Promise((resolve, reject) => {
            this.find(query[i], (err, part) => {

              if (err) {
                return callback(err);
              }
              partIds.push({"_id": part[0]["_id"].toString()});
              resolve(partIds);
            });
          });
          allPromises.push(promise);
        }

        Promise.all(allPromises).then((resolve, reject) => {
          this.getSequence(0, partIds, callback);
        });
      }

    } else if (bioDesignId !== undefined && bioDesignId !== null) {
      query[0] = {bioDesignId: bioDesignId};

      this.find(query[0], (err, parts) => {

        if (err) {
          return callback(err);
        }

        this.getSequence(0, parts, callback);
      })
    };
  }





      //
      //   for (var i = 0; i < bioDesignId.length; ++i) {
      //     query[i] = {bioDesignId: bioDesignId[i]};
      //
      //     this.find(query[i], (err, part) => {
      //
      //       if (err) {
      //         return callback(err);
      //       }
      //       console.log("This is mini parts");
      //       console.log(part[0]);
      //       parts.push(part[0]);
      //       console.log("This is full parts");
      //       console.log(parts);
      //
      //     })
      //     // query = {bioDesignId: {$in: bioDesignId}};
      //   }
      //   console.log("Out of for loop");
      //   console.log(parts);
      //   this.getSequence(0, parts, callback);
      // }




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
  userId: Joi.string().required(),
  displayId: Joi.string().optional(),
  bioDesignId: Joi.string(),
  sequenceId: Joi.string(),
});

Part.indexes = [
  {key: {userId: 1}}
];

module.exports = Part;
