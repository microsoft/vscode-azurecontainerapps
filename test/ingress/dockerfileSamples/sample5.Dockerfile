## Modified example from Azure-Samples/acr-build-helloworld-node
FROM node:15-alpine

COPY . /src
RUN cd /src && npm install
EXPOSE 443/tcp
EXPOSE 5000/udp
CMD ["node", "/src/server.js"]
