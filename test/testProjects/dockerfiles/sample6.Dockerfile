## Modified example from Azure-Samples/acr-build-helloworld-node
FROM node:lts-alpine

COPY . /src
RUN cd /src && npm install

## Extra unrealistic expose scenario used to double-check formatting logic
EXPOSE 80 443/tcp 8080-8090 5000/udp
CMD ["node", "/src/server.js"]
