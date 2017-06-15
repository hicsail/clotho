#!/usr/bin/env bash

mkdir -p ./server/web/public/mini-js
for file in ./server/web/scripts/*.js; do
  s=$file
  s=${s##*/}
  filename=${s%.*}
  ./node_modules/.bin/uglifyjs ./server/web/scripts/${file##*/} -c -m -o ./server/web/public/mini-js/$filename.min.js
done
echo "Minified Javascript"
