FROM node:lts-alpine

COPY . /src
RUN cd /src && npm install
EXPOSE 3001
CMD ["node", "/src/server.js"]
