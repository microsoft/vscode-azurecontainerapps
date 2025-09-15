FROM node:lts-alpine

COPY . /src
RUN cd /src && npm install
EXPOSE 3002
CMD ["node", "/src/server.js"]
