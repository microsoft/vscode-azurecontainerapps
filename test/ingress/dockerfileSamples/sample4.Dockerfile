## Modified example from Azure-Samples/acr-build-helloworld-node
FROM node:lts-alpine

COPY . /src
RUN cd /src && npm install
EXPOSE 8080-8090 80
CMD ["node", "/src/server.js"]
