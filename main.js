const http = require('http');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (socket) => {
  console.log('A client just connected');

  socket.on('message', (msg) => {
    console.log('Received message from client:', msg);

    wss.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  socket.on('close', () => {
    console.log('Client disconnected');
  });
});
wss.onclose = (event) => {
  console.log('WebSocket closed:', event);
};

wss.onerror = (error) => {
  console.error('WebSocket error:', error);
};

server.listen(5000, () => {
  console.log(new Date() + ' Server is listening on port 5000');
});
