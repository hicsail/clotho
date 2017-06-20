FROM ubuntu:latest

ENV NODE_ENV 'docker'

RUN mkdir -p /usr/src/clotho
WORKDIR /usr/src/clotho/server
COPY package.json /usr/src/clotho/

RUN apt-get update
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
RUN echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.0.list
RUN apt-get update
RUN apt-get install -y mongodb-org
RUN apt-get install -y nodejs
RUN apt-get install -y npm
RUN apt-get install -y netcat
RUN npm cache clean -f
RUN apt-get install -y curl                     #Needed for the 'n' package to be installed successfully.
RUN npm install -g n
RUN n 6.0.0

COPY . /usr/src/clotho

RUN npm install
RUN ln -s /usr/bin/nodejs /usr/bin/node

RUN mkdir -p /data/db
EXPOSE 9000

CMD sh ../docker-run.sh
