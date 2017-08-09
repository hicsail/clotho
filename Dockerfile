FROM ubuntu:16.04
FROM mongo:3.4.5
FROM node:8

WORKDIR /usr/src/clotho
COPY package.json /usr/src/clotho/

RUN apt-get update

#Needed to connect to MongoDB
RUN apt-get install -y netcat

#Install Blast

RUN apt-get install -y ncbi-blast+


COPY . /usr/src/clotho

RUN cd remote-compiler && npm install
RUN npm install
RUN npm install -g pm2

EXPOSE 9000
EXPOSE 8000

CMD sh docker-run.sh
