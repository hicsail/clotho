FROM ubuntu:16.04
FROM mongo:3.4.5
FROM node:6.11.0

WORKDIR /usr/src/clotho/server
COPY package.json /usr/src/clotho/

RUN apt-get update

#Needed to connect to MongoDB
RUN apt-get install -y netcat

#Install Blast
RUN sudo apt-get install ncbi-blast+


COPY . /usr/src/clotho

RUN npm install

EXPOSE 9000

CMD sh ../docker-run.sh
