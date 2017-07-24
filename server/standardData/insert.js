const Path = require('path');
const MongoDB = require('mongodb');
const Config = require('../../config');
const Fs = require('fs');

const insertData = {

  data: function () {

    var url = Config.get('/hapiMongoModels/mongodb/uri');
    MongoDB.connect(url, function(err, db) {

      if(err) {
        console.warn('Unable to connect to mongodb');
        return;
      }

      //loop though files
      Fs.readdir(__dirname, (err, items) => {

        for (var file of items) {
          if (file != 'insert.js') {
            var data = require(Path.join(__dirname,file));
            var collection = require(Path.join(__dirname,'../models/',file.split('.')[0]));
            for(var document of data) {
              collection.insertOne(document, (err, result) => {});
            }
          }
        }
        db.close();
        return;
      });

    });
  }
};

module.exports = insertData;


/*


}*/

