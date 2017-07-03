'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Sequence = require('./sequence');
const Strain = require('./strain');
const Medium = require('./medium');
const Part = require('./part');
const Parameter = require('./parameter');
const Module = require('./module');
const Underscore = require('underscore');


class BioDesign extends MongoModels {

  static create(name, description, userId, displayId, imageURL, subBioDesignIds, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      displayId: displayId,
      imageURL: imageURL,
      subBioDesignIds: subBioDesignIds
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }

  // Helper function to clean up query
  static convertBD(bioDesignIds, extra) {

    var query = {};

    if (typeof bioDesignIds !== 'string') {
      // Convert strings to mongo ids.
      for (var i = 0; i < bioDesignIds.length; ++i) {
        bioDesignIds[i] = new MongoModels.ObjectID(bioDesignIds[i].toString());
      }

      if (bioDesignIds.length > 0) {
        query = {_id: {$in: bioDesignIds}};
      }

    } else if (bioDesignIds !== undefined && bioDesignIds !== null) {
      query = {_id: new MongoModels.ObjectID(bioDesignIds)};
    }


    if (extra['name'] !== undefined) {
      query['name'] = {$regex: extra['name'], $options: 'i'};
    } else if (extra['displayId'] !== undefined) {
      query['displayId'] = {$regex: extra['displayId'], $options: 'i'};
    }


    return query;
  }



  // Get complete device or part. If no subbiodesign exists, is treated as a part.
  // Accepts array of bioDesignIds or single string.
  static getBioDesignIds(bioDesignIds, query, callback) {

    if (query == null) {
      query = {};
    }
    var query2 = this.convertBD(bioDesignIds, query);

    this.find(query2, (err, bioDesigns) => {

      // dealing with error
      if (err) {
        return callback(err);
      }

      // otherwise buildup biodesign objects
      var allPromises = [];
      var subBioDesignPromises = [];

      for (var i = 0; i < bioDesigns.length; ++i) {
        // fetch aggregate of part, module, parameter (informally, components)
        // and combine with main biodesign object
        var promise = new Promise((resolve, reject) => {

          this.getBioDesign(bioDesigns[i]._id.toString(), (errGet, components) => {

            if (errGet) {
              reject(errGet);
            }
            resolve(components);
          });
        });
        allPromises.push(promise);

        // Also get subdesigns.
        if (bioDesigns[i].subBioDesignIds !== undefined && bioDesigns[i].subBioDesignIds !== null
          && bioDesigns[i].subBioDesignIds.length !== 0) {

          var subBioDesignPromise = new Promise((resolve, reject) => {
            this.getBioDesignIds(bioDesigns[i].subBioDesignIds, null, (errSub, components) => {

              if (errSub) {
                reject(errSub);
              }
              resolve(components);
            });
          });

          subBioDesignPromises.push(subBioDesignPromise);
        }

      }

      Promise.all(allPromises).then((resolve, reject) => {

        for (var i = 0; i < bioDesigns.length; ++i) {
          bioDesigns[i]['parts'] = resolve[i]['parts'];
          bioDesigns[i]['modules'] = resolve[i]['modules'];
          bioDesigns[i]['parameters'] = resolve[i]['parameters'];

          if (subBioDesignPromises.length === 0) {
            return callback(null, bioDesigns);
          }
        }

        Promise.all(subBioDesignPromises).then((subresolve, subreject) => {

          for (var i = 0; i < bioDesigns.length; ++i) {
            bioDesigns[i]['subdesigns'] = subresolve[i];
          }

          return callback(null, bioDesigns);

        });
      });

    });

  }


// based on biodesignId, fetches all children
  static getBioDesign(bioDesignId, callback) {

    Part.findByBioDesignId(bioDesignId, (err, parts) => {

      if (err) {
        return callback(err);
      }


      Module.findByBioDesignId(bioDesignId, (err, modules) => {

        if (err) {
          return callback(err);
        }

        Parameter.getParameterByBioDesignId(bioDesignId, [], (err, parameters) => {

          if (err) {
            return callback(err);
          }

          return callback(null, {parts: parts, modules: modules, parameters: parameters});
        });

      });

    });

  }


  static getSubDesignByBioDesignId(bioDesignIds, subDesigns, callback) {

  }
  //
  // static getSubDesignByBioDesignId(bioDesignIds, subDesigns, callback) {
  //
  //   var query = {};
  //   if (typeof bioDesignIds == 'string') {
  //     query = {bioDesignId: bioDesignIds};
  //   } else if (bioDesignIds.length > 0) {
  //     query = {bioDesignId: {$in: bioDesignIds}};
  //   }
  //
  //   // No array, just look for bioDesignIds.
  //   if (subDesigns === null || subDesigns.length === 0) {
  //     this.find(query, (err, results) => {
  //
  //       if (err) {
  //         callback(err);
  //       }
  //
  //       return callback(err, results);
  //     });
  //   } else {
  //
  //     var subDesignLabels = ['name', 'displayId', 'description', '_id'];
  //
  //     var allPromises = [];
  //
  //     // Loop through subDesign objects passed in.
  //
  //     for (let subDesignObj of subDesigns) {
  //
  //       // Perform find for given subDesign object.
  //       var promise = new Promise((resolve, reject) => {
  //
  //         query = {};
  //         // Initialize
  //         if (typeof bioDesignIds == 'string') {
  //           query.bioDesignId = bioDesignIds;
  //         } else if (bioDesignIds.length > 0) {
  //           // Combine list of biodesignIds.
  //           query.bioDesignId = {$in: bioDesignIds};
  //         }
  //         // Reformat query so that name and variable have regex, value is cast to number.
  //         for (let label of subDesignLabels) {
  //           if (subDesignObj[label] !== undefined && subDesignObj[label] !== null) {
  //             if (label === 'name' || label === 'displayId' || label === 'description') {
  //               query[label] = {$regex: subDesignObj[label]};
  //             } else if (label === '_id') {
  //               query[label] = new MongoModels.ObjectID(subDesignObj[label]);
  //             }
  //           }
  //         }
  //
  //         this.find(query, (errGet, results) => {
  //
  //           if (errGet) {
  //             return reject(errGet);
  //           }
  //
  //           if (results.length !== undefined && results.length !== null && results.length === 0) {
  //             resolve([]);
  //           }
  //
  //           resolve(results);
  //         });
  //       });
  //       allPromises.push(promise);
  //
  //     }
  //
  //     // For multiple subDesign searches, need to find intersection of matching subDesign documents.
  //     Promise.all(allPromises).then((resolve, reject) => {
  //
  //       if (resolve.length !== undefined && resolve.length !== null) {
  //         if (resolve.length > 1 && resolve.indexOf(null) === -1) {
  //           var foundBioDesignIds = [];
  //           // Loop through subDesign queries to get list of parent biodesignids.
  //           for (var q = 0; q < resolve.length; ++q) {
  //             foundBioDesignIds.push([]);
  //             for (var p = 0; p < resolve[q].length; ++p) {
  //               foundBioDesignIds[q].push(resolve[q][p].parentDesignId);
  //             }
  //           }
  //           // Find the intersection of all BioDesignIds.
  //           var bioDesignIntersection = foundBioDesignIds[0];
  //           for (var p = 1; p < foundBioDesignIds.length; ++p) {
  //             if (bioDesignIntersection.length === 0) break;
  //             bioDesignIntersection = Underscore.intersection(bioDesignIntersection, foundBioDesignIds[p]);
  //           }
  //
  //           if (bioDesignIntersection.length === 0) return callback(null, []);
  //
  //           return callback(null, bioDesignIntersection);
  //
  //
  //         } else if (resolve.length === 1) {
  //           return callback(null, resolve[0].parentDesignId);
  //         } else if (resolve.length > 1 && resolve.indexOf(null) !== -1) {
  //           return callback(null, []);
  //         }
  //       }
  //       return callback(reject);
  //     });
  //
  //
  //   }
  //
  // }


}


//const SharableObjBase = require('org.clothocad.core.datums.SharableObjBase');
//const Reference = require('org.clothocad.core.persistence.annotations.Reference');
//const ReferenceCollection = require('org.clothocad.core.persistence.annotations.ReferenceCollection');

//TO DO: need to import js equivalent of hashset and set in java

// class BioDesign extends MongoModels {   // might also need to extend SharableObjBase
//
//     module;
//     parameters;
//     parts;
//     polynucleotides;
//     strains;
//     media;
//     subDesigns;
//     parentDesigns;
//

// createParameter(value, variable) {
//     parameter = new Parameter(value, variable); // Parameter class will be created
//     addParameter(parameter);
//     return parameter;
// }
//
// addParameter(parameter) {
//     if (this.parameters === null) {
//         parameter = new HashSet<Parameter>();
//     }
//     this.parameters.add(parameter);
// }
//
// addPart(part) {
//     if (this.parts === null) {
//         parts = new HashSet<Part>();
//     }
//     this.parts.add(part);
// }
//
// addPolynucleotide(polynucleotide) {
//     if (this.polynucleotides === null) {
//         polynucleotide = new HashSet<Polynucleotide>();
//     }
//     this.polynucleotides.add(polynucleotide);
// }
//
// addStrain(strain) {
//     if (this.strains === null) {
//         strain = new HashSet<Strain>();
//     }
//     this.strains.add(strain);
// }
//
// addMedium(medium) {
//     if (this.media === null) {
//         medium = new HashSet<Medium>();
//     }
//     this.media.add(medium);
// }
//
// addSubDesign(subDesign) {
//     if (this.subDesigns === null) {
//         subDesign = new HashSet<BioDesign>();
//     }
//     this.subDesigns.add(subDesign);
// }


BioDesign.collection = 'biodesigns';

BioDesign.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  displayId: Joi.string().optional(),
  moduleId: Joi.string(),
  parentDesignId: Joi.string(),
  subBioDesignIds: Joi.array().items(Joi.string()),
  media: Joi.array().items(Medium.schema),
  polynucleotides: Joi.array().items(Sequence.schema),
  strains: Joi.array().items(Strain.schema)
});

BioDesign.indexes = [
  {key: {userId: 1}}
];

module.exports = BioDesign;
