## Modified example from Azure-Samples/acr-build-helloworld-node
FROM node:lts-alpine

COPY . /src
RUN cd /src && npm install
EXPOSE 80 8080-8090
CMD ["node", "/src/server.js"]
