'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class BasicModule extends MongoModels {

  static create(name, description, feature, userId, callback) {

    const document = {
      name: name,
      description: description,
      feature: feature,
      userId: userId,
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }

// TODO: addFeature function
// Not called upon at all though


// Original Java
//   @NotNull
//   @Size(min=1)
//   @Getter
//   @Setter
//   @ReferenceCollection
//   protected Set<Feature> features;
//
//   public BasicModule(String name, ModuleRole role, Set<Feature> features, Person author) {
//   super(name, role, author);
//   this.features = features;
// }
//
// public BasicModule(String name, String description, ModuleRole role, Set<Feature> features, Person author) {
//   super(name, description, role, author);
//   this.features = features;
// }
//
// public void addFeature(Feature feature) {
//   if (features == null) {
//     features = new HashSet<Feature>();
//   }
//   features.add(feature);
// }
//
}


BasicModule.collection = 'basicModule';

// Does not include shareableobjbase properties.
BasicModule.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  feature: Joi.object(),
  userId: Joi.string().required(),
});

BasicModule.indexes = [
  {key: {userId: 1}}
];

module.exports = BasicModule;
