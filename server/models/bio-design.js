'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Sequence = require('./sequence');
const Strain = require('./strain');
const Medium = require('./medium');
const Part = require('./part');
const Parameter = require('./parameter');
const Module = require('./module');


class BioDesign extends MongoModels {

  static create(name, description, userId, displayId, imageURL, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      displayId: displayId,
      imageURL: imageURL
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }

  // accepts array of bioDesignIds
  static getBioDesignIds(bioDesignIds, query, callback) {

    if (query == null) {
      query = {};
    }
    var query2 = {};

    if (typeof bioDesignIds !== 'string') {
      for (var i = 0; i < bioDesignIds.length; i++) {
        bioDesignIds[i] = new MongoModels.ObjectID(bioDesignIds[i].toString());
      }

      query2 = {_id: {$in: bioDesignIds}};
    } else {
      query2 = {_id: new MongoModels.ObjectID(bioDesignIds)};
    }

    for (var attrname in query) {
      query2[attrname] = query[attrname];
    }
    console.log(query2);

    this.find(query2, (err, bioDesigns) => {


      // dealing with error
      if (err) {
        return callback(err);
      }

      // otherwise buildup biodesign objects
      var allPromises = [];
      for (var i = 0; i < bioDesigns.length; i++) {
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
      }

      Promise.all(allPromises).then((resolve,reject)=>{
        for(var i = 0; i < bioDesigns.length; i++){
          bioDesigns[i]['parts'] = resolve[i]['parts'];
          bioDesigns[i]['modules'] = resolve[i]['modules'];
          bioDesigns[i]['parameters'] = resolve[i]['parameters'];
        }
        return callback(null, bioDesigns);
      });
    }
  );
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

      Parameter.getParameterByBioDesignId(bioDesignId, null, (err, parameters) => {

        if (err) {
          return callback(err);
        }


        return callback(null, {parts: parts, modules: modules, parameters: parameters});
      });

    });

  });

}
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
  subDesignIds: Joi.array().items(Joi.string()),
  media: Joi.array().items(Medium.schema),
  polynucleotides: Joi.array().items(Sequence.schema),
  strains: Joi.array().items(Strain.schema)
});

BioDesign.indexes = [
  {key: {userId: 1}}
];

module.exports = BioDesign;
