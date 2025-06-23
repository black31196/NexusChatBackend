// src/server.js
const path         = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.express') });

const http              = require('http');
const app               = require('./app');
const { initPostgres }  = require('./db/postgres');
const { connectToMongo }= require('./db/mongo');
const { seedAdminUser } = require('./db/seeds');
const { Server: IOServer } = require('socket.io');
const registerChatEvents   = require('./sockets/events');

(async () => {
  await initPostgres();
  if (process.env.NODE_ENV !== 'production') {
    await seedAdminUser();
  }
  await connectToMongo();

  // 1) build HTTP server on your Express app
  const server = http.createServer(app);

  // 2) attach a fresh Socket.IO server
  const io = new IOServer(server, {
    path: '/socket.io',
    cors: {
      origin:      process.env.ALLOWED_ORIGINS.split(','),
      credentials: true
    }
  });

  // 3) make `io` available to controllers
  app.set('io', io);

  // 4) when a client connects, log it and register your chat events
  io.on('connection', (socket) => {
    console.log('[Socket.IO] client connected:', socket.id);
    registerChatEvents(socket, io);
  });

  // 6) Start listening
  const PORT = parseInt(process.env.PORT, 10) || 3000;
  server.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
})();
