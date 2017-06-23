# ![Clotho Logo](http://user-images.githubusercontent.com/5147346/27489828-09be9d72-580a-11e7-88ef-b79c8b5fa069.png) Clotho
[![CircleCI](https://circleci.com/gh/hicsail/clotho/tree/master.svg?style=svg&circle-token=b9f8fd47abba8c98cde2c1b04ca736ef4362a054)](http://circleci.com/gh/hicsail/clotho/tree/master)

Clotho is a framework for engineering synthetic biological systems and managing the data used to create them. You can author data schemas, run functions and algorithms, and tie Clotho into existing applications.

## Live Demo

We have continuous integration set up with [CircleCI](http://circleci.com) which deploys the master branch onto our server.
Check it out at [128.31.25.91:9000](http://128.31.25.91:9000/)

## Technology

Clotho is built with the [hapi](https://hapijs.com/) framework. We're
using [MongoDB](http://www.mongodb.org/) as a data store.

We are using [Docker](http://www.docker.com/) for all production level deployments.

## Requirements

You need [Node.js](http://nodejs.org/download/) installed and you'll need
[MongoDB](http://www.mongodb.org/downloads) installed and running.

We use [`bcrypt`](https://github.com/ncb000gt/node.bcrypt.js) for hashing
secrets. If you have issues during installation related to `bcrypt` then [refer
to this wiki
page](https://github.com/jedireza/frame/wiki/bcrypt-Installation-Trouble).

### Production Requirements

You will need to install [Docker](http://www.docker.com/) if you wish to simplify installing of the application, or run it in production mode. We are using [Docker Compose](https://github.com/docker/compose) to run the application in an isolated environment with the correct requirements. [Docker Compose](https://github.com/docker/compose) will install all needed requirements when building.

## Installation

```bash
git clone git@github.com:hicsail/clotho.git
cd clotho
npm install
```

### Production Installation

```bash
docker-compose up
```
This will build the application and start running the application on port 9000
If you wish just to build the application run the following command.

```bash
docker-compose build
```

## Configuration

Simply edit `config.js`. The configuration uses
[`confidence`](https://github.com/hapijs/confidence) which makes it easy to
manage configuration settings across environments. __Don't store secrets in
this file or commit them to your repository.__

__Instead, access secrets via environment variables.__ We use
[`dotenv`](https://github.com/motdotla/dotenv) to help make setting local
environment variables easy (not to be used in production).

Simply copy `.env-sample` to `.env` and edit as needed. __Don't commit `.env`
to your repository.__


## First time setup

__WARNING__: This will clear all data in the following MongoDB collections if
they exist: `accounts`, `adminGroups`, `admins`, `authAttempts`, `sessions`,
`statuses`, and `users`.

```bash
npm run first-time-setup

# > node first-time-setup.js

# MongoDB URL: (mongodb://localhost:27017/clotho)
# Root user email: jedireza@gmail.com
# Root user password:
# Setup complete.
```
## Running the app

```bash
npm start

# > ./node_modules/nodemon/bin/nodemon.js -e js,md server

# 09 Sep 03:47:15 - [nodemon] v1.10.2
# ...
```

[`nodemon`](https://github.com/remy/nodemon) watches for changes in server
code and restarts the app automatically.

### Running the app with Docker
```bash
docker-compose up
```

Now you should be able to point your browser to http://localhost:9000/ and
see the home page.

## Running in production

```bash
$ node server.js
```

Unlike `$ npm start` this doesn't watch for file changes. Also be sure to set
these environment variables in your production environment:

 - `NODE_ENV=production` - This is important for many different
   optimizations.
 - `NPM_CONFIG_PRODUCTION=false` - This tells `$ npm install` to not skip
   installing `devDependencies`, which we may need to run the first time
   setup script.


## Have a question?

Any issues or questions (no matter how basic), open an issue. Please take the
initiative to read relevant documentation and be pro-active with debugging.


## Want to contribute?

Contributions are welcome. If you're changing something non-trivial, you may
want to submit an issue before creating a large pull request.


## Running tests

[Lab](https://github.com/hapijs/lab) is part of the hapi ecosystem and what we
use to write all of our tests.

```bash
npm test

# > ./node_modules/lab/bin/lab -c

# ..................................................
# ..................................................
# ..................................................
# ..................................................
# ..................................................
# ........

# 258 tests complete
# Test duration: 2398 ms
# No global variable leaks detected
# Coverage: 100.00%
# Linting results: No issues
```

## License

MIT
