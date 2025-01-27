const http = require('http');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!');
});

const wss = new WebSocket.Server({ server });

// Object to hold rooms and the users in them
let rooms = {};

// Handle WebSocket connections
wss.on('connection', (socket, req) => {
  console.log('A client has connected:', req.socket.remoteAddress);

  // Send initial message to the client
  socket.send(JSON.stringify({ message: 'Welcome! You are connected to the WebSocket server.' }));

  socket.on('message', (msg) => {
    console.log('Received message:', msg);

    const data = JSON.parse(msg);

    // Message structure: { action: 'create-room' | 'join-room', roomName: string, userType: 'therapist' | 'patient' }
    switch (data.action) {
      case 'create-room':
        handleCreateRoom(socket, data);
        break;

      case 'join-room':
        handleJoinRoom(socket, data);
        break;

      default:
        socket.send(JSON.stringify({ error: 'Unknown action' }));
    }
  });

  socket.on('close', () => {
    console.log('Client disconnected');
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleCreateRoom(socket, data) {
  if (data.userType !== 'therapist') {
    socket.send(JSON.stringify({ error: 'Only therapists can create rooms.' }));
    return;
  }

  // Check if the room already exists
  if (rooms[data.roomName]) {
    socket.send(JSON.stringify({ error: `Room "${data.roomName}" already exists.` }));
  } else {
    // Create the room with the therapist
    rooms[data.roomName] = { therapist: socket, patients: [] };
    socket.send(JSON.stringify({ success: `Room "${data.roomName}" created successfully.` }));
  }
}

function handleJoinRoom(socket, data) {
  if (data.userType !== 'patient') {
    socket.send(JSON.stringify({ error: 'Only patients can join rooms.' }));
    return;
  }

  // Check if the patient is already in a room
  let currentRoom = null;
  for (let roomName in rooms) {
    if (rooms[roomName].patients.includes(socket)) {
      currentRoom = roomName;
      break;
    }
  }

  if (currentRoom) {
    socket.send(JSON.stringify({ error: 'You are already in a room. You can only join one room at a time.' }));
    return;
  }

  // Check if the room exists
  if (!rooms[data.roomName]) {
    socket.send(JSON.stringify({ error: `Room "${data.roomName}" does not exist.` }));
    return;
  }

  // Add the patient to the room
  rooms[data.roomName].patients.push(socket);
  socket.send(JSON.stringify({ success: `You have successfully joined room "${data.roomName}".` }));

  // Notify the therapist and other patients in the room
  rooms[data.roomName].therapist.send(JSON.stringify({ success: `A patient has joined your room "${data.roomName}".` }));
  rooms[data.roomName].patients.forEach((client) => {
    if (client !== socket && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ success: `A patient has joined room "${data.roomName}".` }));
    }
  });
}

// Start the server
server.listen(5000, () => {
  console.log(new Date() + ' - WebSocket server is listening on port 5000');
});
