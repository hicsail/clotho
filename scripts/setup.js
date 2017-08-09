const Async = require('async');
const Fs = require('fs');
const Path = require('path');
const Promptly = require('promptly');

Async.auto({
  Gmail: function (callback) {

    Promptly.prompt('Gmail: ', callback);
  },
  Password: ['Gmail', function (results, callback) {

    const options = {
      replace: '*'
    }

    Promptly.password('Password: ', options, callback);
  }],
  WriteFile: ['Password', function (results, callback) {

    var path = Path.join(__dirname, '../.env');
    Fs.writeFile(path,`SMTP_USERNAME=${results.Gmail}\nSMTP_PASSWORD=${results.Password}`, callback)
  }]
}, (err, results) => {

  if(err) {
    console.log(err);
    return;
  }

  console.log('Env Complete');
});
