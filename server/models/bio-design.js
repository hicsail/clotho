'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class BioDesign extends MongoModels {

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
            author: author
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
            author: author
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
        this.polynucleotides.add(polynucleotide)
    }

    addStrain(strain) {
        if (this.strains === null) {
            strain = new HashSet<Strain>();
        }
        this.strains
    }

}

BioDesign.schema = Joi.object.keys ({

});