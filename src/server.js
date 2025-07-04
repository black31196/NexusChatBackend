// src/server.js
require('./config/dotenv');
const path         = require('path');
//require('dotenv').config({path: path.resolve(__dirname, '.env.postgres')});
//require('dotenv').config({ path: path.resolve(__dirname, '.env.express') });
//require('dotenv').config({ path: path.resolve(__dirname, '.env.mongodb') });
//require('dotenv').config({ path: path.resolve(__dirname, '.env.lineOA') });

const http              = require('http');
const app               = require('./app');
const { connectToMongo, getDb }= require('./db/mongo');

const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');

const { initPostgres }  = require('./db/postgres');
const { seedAdminUser } = require('./db/seeds');
const { Server: IOServer } = require('socket.io');
const registerChatEvents   = require('./sockets/events');

(async () => {
  // First, connect to all databases
  await connectToMongo();
  await initPostgres();
  if (process.env.NODE_ENV !== 'production') {
    await seedAdminUser();
  }

  const storage = new GridFsStorage({
    db: connectToMongo(), // Provide the connected db instance
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) return reject(err);
          const filename = buf.toString('hex') + path.extname(file.originalname);
          resolve({ bucketName: 'uploads', filename });
        });
      });
    }
  });

  const upload = multer({ storage });
  
  // Make the upload middleware available to the entire app
  app.set('upload', upload);

  // 1) build HTTP server on your Express app
  const server = http.createServer(app);
  const io = new IOServer(server, {
    path: '/socket.io',
    cors: {
      origin:      process.env.ALLOWED_ORIGINS.split(','),
      credentials: true
    }
  });
  app.set('io', io);


  io.on('connection', (socket) => {
    console.log('[Socket.IO] client connected:', socket.id);
    registerChatEvents(socket, io);
  });

  // 6) Start listening
  const PORT = parseInt(process.env.PORT, 10) || 3000;
  server.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
})();
