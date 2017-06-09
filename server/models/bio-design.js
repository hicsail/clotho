'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Sequence = require('./sequence');
const Strain = require('./strain');
const Medium = require('./medium');

class BioDesign extends MongoModels {

  static create(name, description, userId, displayId, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      displayId: displayId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
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
