#!/bin/bash

while ! nc -z mongo 27017; do sleep 3; echo "waiting for mongo to start"; done
npm run first-time-setup
npm start
