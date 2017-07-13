FROM ubuntu:16.04
FROM mongo:3.4.5
FROM node:8

WORKDIR /usr/src/clotho
COPY package.json /usr/src/clotho/

RUN apt-get update

#Needed to connect to MongoDB
RUN apt-get install -y netcat

COPY . /usr/src/clotho

RUN npm install
RUN npm install -g pm2

EXPOSE 9000

CMD sh docker-run.sh
