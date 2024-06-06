## Modified example from Azure-Samples/acr-build-helloworld-node
FROM node:lts-alpine

COPY . /src
RUN cd /src && npm install

CMD ["node", "/src/server.js"]
