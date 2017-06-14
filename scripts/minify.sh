#!/usr/bin/env bash

npm install uglify-js

cd ../server/web/scripts

uglifyjs account.js -c -m -o ../public/mini-js/account.min.js
uglifyjs login.js -c -m -o ../public/mini-js/login.min.js
uglifyjs register.js -c -m -o ../public/mini-js/register.min.js
