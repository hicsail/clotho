'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

//const SharableObjBase = require('org.clothocad.core.datums.SharableObjBase');
//const Reference = require('org.clothocad.core.persistence.annotations.Reference');
//const ReferenceCollection = require('org.clothocad.core.persistence.annotations.ReferenceCollection');

//TODO: need to import js equivalent of hashset and set in java

class BioDesign extends MongoModels {   // might also need to extend SharableObjBase

    module;
    parameters;
    parts;
    polynucleotides;
    strains;
    media;
    subDesigns;
    parentDesigns;


    static create(name, description, author) {

        const document = {
            name: name,
            description: description,
            author_id: author_id
        };

        this.insertOne(document, (err, docs) => {
            if (err) {
                return callback(err);
            }
            callback(null, docs[0]);
    });
    }

    static create(name, author){

        const document = {
            name: name,
            author_id: author_id
        };

        this.insertOne(document, (err, docs) => {
            if (err) {
                return callback(err);
            }
            callback(null, docs[0]);
    });
    }

    createParameter(value, variable) {
        parameter = new Parameter(value, variable); // Parameter class will be created
        addParameter(parameter);
        return parameter;
    }

    addParameter(parameter) {
        if (this.parameters === null) {
            parameter = new HashSet<Parameter>();
        }
        this.parameters.add(parameter);
    }

    addPart(part) {
        if (this.parts === null) {
            parts = new HashSet<Part>();
        }
        this.parts.add(part);
    }

    addPolynucleotide(polynucleotide) {
        if (this.polynucleotides === null) {
            polynucleotide = new HashSet<Polynucleotide>();
        }
        this.polynucleotides.add(polynucleotide);
    }

    addStrain(strain) {
        if (this.strains === null) {
            strain = new HashSet<Strain>();
        }
        this.strains.add(strain);
    }

    addMedium(medium) {
        if (this.media === null) {
            medium = new HashSet<Medium>();
        }
        this.media.add(medium);
    }

    addSubDesign(subDesign) {
        if (this.subDesigns === null) {
            subDesign = new HashSet<BioDesign>();
        }
        this.subDesigns.add(subDesign);
    }

}

BioDesign.schema = Joi.object.keys ({
    name: Joi.string().required(),
    description: Joi.string(),
    author: Joi.string().required()
});

module.exports = BioDesign;
