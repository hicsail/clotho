'use strict';
const Confidence = require('confidence');
const Dotenv = require('dotenv');


Dotenv.config({silent: true});

const criteria = {
  env: process.env.NODE_ENV
};


const config = {
  $meta: 'This file configures the plot device.',
  projectName: 'Clotho',
  port: {
    web: {
      $filter: 'env',
      test: 9090,
      production: process.env.PORT,
      $default: 9000
    }
  },
  passwordRequirements: {
    min: 8,
    max: 32,
    uppercase: 1,
    lowercase: 1,
    numeric: 1
  },
  authAttempts: {
    forIp: 50,
    forIpAndUser: 7
  },
  cookieSecret: {
    $filter: 'env',
    production: process.env.COOKIE_SECRET,
    $default: '!k3yb04rdK4tz~4qu4~k3yb04rdd0gz!'
  },
  hapiMongoModels: {
    mongodb: {
      uri: {
        $filter: 'env',
        production: process.env.MONGODB_URI,
        test: 'mongodb://localhost:27017/clotho-test',
        $default: 'mongodb://localhost:27017/clotho'
      }
    },
    autoIndex: true
  },
  nodemailer: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD
    }
  },
  system: {
    fromAddress: {
      name: 'Clotho',
      address: 'do-not-reply@clotho.com'
    },
    toAddress: {
      name: 'Clotho',
      address: 'do-not-reply@clotho.com'
    }
  }
};


const store = new Confidence.Store(config);


exports.get = function (key) {

  return store.get(key, criteria);
};


exports.meta = function (key) {

  return store.meta(key, criteria);
};
