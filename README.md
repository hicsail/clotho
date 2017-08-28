# ![Clotho Logo](https://github-production-user-asset-6210df.s3.amazonaws.com/5147346/27489828-09be9d72-580a-11e7-88ef-b79c8b5fa069.png "Clotho") Clotho
[![CircleCI](https://circleci.com/gh/hicsail/clotho/tree/master.svg?style=svg&circle-token=b9f8fd47abba8c98cde2c1b04ca736ef4362a054)](http://circleci.com/gh/hicsail/clotho/tree/master)

Clotho is a framework for engineering synthetic biological systems and managing the data used to create them. You can author data schemas, run functions and algorithms, and tie Clotho into existing applications.

## Live Demo

We have continuous integration set up with [CircleCI](http://circleci.com) which deploys the master branch onto our server.
Check it out at [alpha.clothocad.org](http://alpha.clothocad.org)

## Technology

Clotho is built with the [hapi](https://hapijs.com/) framework. We're
using [MongoDB](http://www.mongodb.org/) as a data store.

## Requirements

You need [Node.js](http://nodejs.org/download/) installed and you'll need
[MongoDB](http://www.mongodb.org/downloads) installed and running.

You can also install [Java 8](https://www.java.com/), and [Python 3](https://www.python.org/)

We use [`bcrypt`](https://github.com/ncb000gt/node.bcrypt.js) for hashing
secrets. If you have issues during installation related to `bcrypt` then [refer
to this wiki
page](https://github.com/jedireza/frame/wiki/bcrypt-Installation-Trouble).


## Installation

```bash
git clone git@github.com:hicsail/clotho.git
cd clotho
npm install
npm install -g pm2
npm run setup
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


## Running the app

```bash
npm run pm2
```

Now you should be able to point your browser to [localhost:9000](http://localhost:9000/) and
see the home page.

* If running for the first time, please go to [/setup](http://localhost:9000/setup) and create a root user

## Stopping the app

```bash
pm2 stop all
```

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
