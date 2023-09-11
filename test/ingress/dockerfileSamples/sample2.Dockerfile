## Modified example from Azure-Samples/acr-build-helloworld-node
FROM node:15-alpine

COPY . /src
RUN cd /src && npm install
EXPOSE 80
EXPOSE 443
CMD ["node", "/src/server.js"]
