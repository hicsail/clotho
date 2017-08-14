'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class Feature extends MongoModels {

  static create(name, description, userId, displayId, role, annotationId, superAnnotationId, moduleId, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      displayId: displayId,
      role: role.toUpperCase(),
      annotationId: annotationId,
      superAnnotationId: superAnnotationId,
      moduleId: moduleId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      else {
        callback(null, docs[0]);
      }
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


  static findByAnnotationIdOnly(i, annotationId, callback) {

    const query = {'annotationId': annotationId};

    this.find(query, (err, feature) => {

      if (err) {
        return callback(err);
      }

      callback(null, [i, feature]);
    });
  }


  static findBySuperAnnotationId(superAnnotationId, callback) {

    const query = {'superAnnotationId': superAnnotationId};

    this.find(query, (err, annotations) => {

      if (err) {
        return callback(err);
      }

      callback(null, annotations);
    });
  }

  static findByModuleId(moduleId, callback) {

    const query = {'moduleId': moduleId};

    this.find(query, (err, modules) => {

      if (err) {
        return callback(err);
      }

      callback(null, modules);
    });
  }

  static delete(document, callback) {

    document.toDelete = true;
    this.findByIdAndUpdate(document._id.toString(), document, callback);
  }

  static undelete(document, callback) {

    delete document.toDelete;
    this.findByIdAndUpdate(document._id.toString(), document, callback);
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
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  displayId: Joi.string().optional(),
  role: Joi.string().uppercase().required(),
  annotationId: Joi.string().required(),
  superAnnotationId: Joi.string().required(),
  genBankId: Joi.string(),
  moduleId: Joi.string(),
  swissProtId: Joi.string(),
  riskGroup: Joi.number() // Is short according to clotho3.
});

Feature.indexes = [
  {key: {userId: 1}}
];

module.exports = Feature;
