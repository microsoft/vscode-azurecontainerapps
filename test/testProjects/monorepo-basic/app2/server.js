const http = require('http');

const port = process.env.PORT || 80;
const message = process.env.MESSAGE || 'world';

const server = http.createServer((_, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write(`Hello ${message}\n`);
});

server.listen(port);
console.log(`Server running at http://localhost: ${port}`);
