'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Sequence = require('feature');
const User = require('user');

class Feature extends MongoModels {

  static create(name, role, author, callback) {
    return create(name, null, role, author, callback);
  }

  static create(name, description, role, author, callback) {
    const document = {
      name: name,
      description: description,
      role: role,
      author:author
    };

    this.insertOne(document, (err, docs) => {
      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }

}

// Needs to be fixed.
function setRiskGroup(newrg) {
  (if (newrg > riskGroup && newrg <= 5) {
    riskGroup = newrg;
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
  sequence: Sequence.schema,
  genbankId: Joi.string(),
  swissProtId: Joi.string(),
  riskGroup: Joi.number(), // Is short according to clotho3.
  role: Joi.string.regex("(BARCODE)|(CDS)|(DEGRADATION\_TAG)|(GENE)|(LOCALIZATION\_TAG)|(OPERATOR)|(PROMOTER)|(SCAR)|(SPACER)|(RBS)|(RIBOZYME)|(TERMINATOR)").required(),
  parentFeature: Feature.schema,
  name: Joi.string().required(),
  description: Joi.string(),
  author: User.schema
});

Feature.indexes = [];

module.exports = Feature;
