'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Format extends MongoModels {
  static create(callback) {
    const document = {
    };

    this.insertOne(document, (err, docs) => {
      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}


Format.collection = 'formats';

Format.schema = Joi.object().keys({
  _id: Joi.object()
});

Format.indexes = [];

module.exports = Format;

// original Java

// /**
//  * Interface for a ClothoFormat
//  * @author J.Christopher Anderson
//  * @author Douglas Densmore
//  * @author Nicholas Roehner
//  */
// @JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, property = "schema", include = JsonTypeInfo.As.PROPERTY)
// public interface Format {
//
//   /**
//    * Test whether a part is a valid member of the ClothoFormat specs
//    * @param p Part to test
//    * @return true if adheres to the format; false otherwise
//    */
//   public boolean checkPart(Part p);
//
//   /**
//    * Check to see if an arraylist of parts permits making a composite part
//    * @param composition
//    * @return
//    */
//   public boolean checkComposite(List<Part> subParts);
//
//   /**
//    * Generates composite part in accordance with this format
//    * @param name
//    * @param composition
//    * @param author
//    * @return
//    */
//   public Part generateCompositePart(String name, List<Part> subParts, Person author);
//
//   /**
//    * Generates composite part in accordance with this format
//    * @param name
//    * @param description
//    * @param composition
//    * @param author
//    * @return
//    */
//   public Part generateCompositePart(String name, String description, List<Part> subParts, Person author);
//
// }

