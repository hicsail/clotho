#!/usr/bin/env bash
for file in ./server/web/scripts/*.js; do
  s=$file
  s=${s##*/}
  filename=${s%.*}
  ./node_modules/.bin/uglifyjs ./server/web/scripts/${file##*/} -c -m -o ./server/web/public/mini-js/$filename.min.js
done
