'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Feature = require('./feature');

class Annotation extends MongoModels {

  static create(name, description, start, end, isForwardStrand, userId, callback) {

    const document = {
      name: name,
      description: description,
      start: start,
      end: end,
      isForwardStrand: isForwardStrand,
      userId: userId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }

// Original Java
//   /**
//    * Reverse the orientation of the annotation (reverse complement
//    * it and flip flop the start and end sites).  Called from NucSeq
//    * when it's reverse complemented
//    * @param seqLength
//    */
//   public void invert(int seqLength) {
//   isForwardStrand = !isForwardStrand;
//   int s = start;
//   start = seqLength - end;
//   end = seqLength - s;
// }
//
// /**
//  * Get the approriate color for the annoation
//  * @return either the forward or reverse color depending
//  * on the orientation of the annotation
//  */
// public Color getColor() {
//   if (isForwardStrand) {
//     return getForwardColor();
//   } else {
//     return getReverseColor();
//   }
// }
//
// /**
//  * Get the forward color as an integer code
//  * @return an integer of the Color
//  */
// public int getForwardColorAsInt() {
//   return getForwardColor().getRGB();
// }
//
// /**
//  * Get the reverse color as an integer code
//  * @return an integer of the Color
//  */
// public int getReverseColorAsInt() {
//   return getReverseColor().getRGB();
// }
//
// /**
//  * Get the preferred forward color for this Annotation.  If no forward color
//  * was set, a default color will be returned.
//  * @return an AWT Color object.  It won't be null;
//  */
// public Color getForwardColor() {
//   if (forwardColor == null) {
//     forwardColor = new Color(125, 225, 235);
//   }
//   return forwardColor;
// }
//
// /**
//  * Get the preferred reverse color for this Annotation.  If no reverse color
//  * was set, a default color will be returned.
//  * @return an AWT Color object.  It won't be null;
//  */
// public Color getReverseColor() {
//   if (reverseColor == null) {
//     reverseColor = new Color(125, 225, 235);
//   }
//   return reverseColor;
// }
//
// /**
//  * Set the forward and reverse preferred colors for this feature to some
//  * random medium-bright color.
//  */
// public void setRandomColors() {
//   int[][] intVal = new int[2][3];
//   for (int j = 0; j < 3; j++) {
//     double doubVal = Math.floor(Math.random() * 155 + 100);
//     intVal[0][j] = (int) doubVal;
//     intVal[1][j] = 255 - intVal[0][j];
//   }
//   forwardColor = new Color(intVal[0][0], intVal[0][1], intVal[0][2]);
//   reverseColor = new Color(intVal[1][0], intVal[1][1], intVal[1][2]);
// }


}


Annotation.collection = 'annotations';

// Does not include shareableobjbase properties.
Annotation.schema = Joi.object().keys({
  _id: Joi.object(),
  symbol: Joi.string(),
  isForwardStrand: Joi.boolean().required(),
  feature: Feature.schema,
  start: Joi.number().integer().required(),
  end: Joi.number().integer().required(),
  forwardColor: Joi.array().length(3).items(Joi.number().integer()), // Represent Color Object in Java
  reverseColor: Joi.array().length(3).items(Joi.number().integer()),
  name: Joi.string().required(),
  userId: Joi.string().required(),
  description: Joi.string()
});

Annotation.indexes = [
  {key: {userId: 1}}
];

module.exports = Annotation;


