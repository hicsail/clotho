'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');

class CompositeModule extends MongoModels {

  static create(name, description, role, subModules, userId, callback) {

    const document = {
      name: name,
      description: description,
      role: role,
      subModule: subModules,
      userId: userId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }


// TODO: addSubModule function
// Called upon once

// Original Java
//   @NotNull
//   @Size(min=1)
//   @Getter
//   @Setter
//   @ReferenceCollection
//   protected Set<Module> subModules;
//
//   public CompositeModule(String name, ModuleRole role, Set<Module> subModules, Person author) {
//   super(name, role, author);
//   this.subModules = subModules;
// }
//
// public CompositeModule(String name, String description, ModuleRole role, Set<Module> subModules,
//   Person author) {
//   super(name, description, role, author);
//   this.subModules = subModules;
// }
//
// public void addSubModule(Module subModule) {
//   if (subModules == null) {
//     subModules = new HashSet<Module>();
//   }
//   subModules.add(subModule);
// }
}


CompositeModule.collection = 'compositeModule';

// Does not include shareableobjbase properties.
CompositeModule.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  role: Joi.object(),
  subModules: Joi.object(),
  userId: Joi.string().required()
});

CompositeModule.indexes = [
  {key: {userId: 1}}
];

module.exports = CompositeModule;
