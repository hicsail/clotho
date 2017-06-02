'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Feature extends MongoModels {

  static create(annotationId, name, description, role, userId, callback) {

    const document = {
      name: name,
      annotationId: annotationId,
      description: description,
      role: role,
      userId: userId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }

  static findByAnnotationId(annotationId, callback) {

    const query = {'annotationId': annotationId};
    this.find(query, (err, annotations) => {

      if (err) {
        return callback(err);
      }
      callback(null, annotations);
    });
  }
}

// /**
//  * Change the risk group of the Feature. You can only raise the risk group.
//  *
//  * @param newrg the new risk group (1 through 5)
//  */
// public final void setRiskGroup(short newrg) {
//   if (newrg > riskGroup && newrg <= 5) {
//     //addUndo("_riskGroup", _featDatum._riskGroup, newrg);
//     riskGroup = newrg;
//     // setChanged(org.clothocore.api.dnd.RefreshEvent.Condition.RISK_GROUP_CHANGED);
//   }
//   //todo: throw appropriate invalid operation exception
// }


Feature.collection = 'features';

Feature.schema = Joi.object().keys({
  _id: Joi.object(),
  annotationId: Joi.string().required(),
  genbankId: Joi.string(),
  swissProtId: Joi.string(),
  riskGroup: Joi.number(), // Is short according to clotho3.
  role: Joi.string().valid('BARCODE', 'CDS', 'DEGRADATION_TAG', 'GENE', 'LOCALIZATION_TAG', 'OPERATOR', 'PROMOTER', 'SCAR', 'SPACER', 'RBS', 'RIBOZYME', 'TERMINATOR').required(),
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required()
});

Feature.indexes = [
  {key: {userId: 1}}
];

module.exports = Feature;
