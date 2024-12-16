const http = require('http');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (socket) => {
  console.log('Client connected');
  
  // Generate and send a unique client ID
  const clientId = generateUniqueId();
  socket.clientId = clientId;
  socket.send(JSON.stringify({
    type: 'CLIENT_ID',
    clientId: clientId
  }));

  socket.on('message', (msg) => {
    console.log(`Message from ${socket.clientId}:`, msg);

    wss.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          sender: socket.clientId,
          message: msg
        }));
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

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(new Date() + ` Server is listening on port ${port}`);
});
