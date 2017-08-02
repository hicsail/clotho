#!/bin/bash
# set enviormebt variables
export NODE_ENV=production
export MONGODB_URI=mongodb://mongo:27017/clotho

# wait to see if mongo is still starting up
while ! nc -z mongo 27017; do sleep 3; echo "waiting for mongo to start"; done
npm run setup
pm2 start server.js --no-daemon
