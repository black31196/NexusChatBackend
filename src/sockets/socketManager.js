// src/sockets/socketManager.js
const { Server } = require('socket.io');
const logger     = require('../utils/logger');

let io = null;

exports.init = (httpServer, options) => {
  io = new Server(httpServer, options);

  io.on('connection', (socket) => {
    logger.info(`🔌 New client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      logger.info(`👋 Client disconnected: ${socket.id}`);
    });
  });

  logger.info('✅ Socket.IO server initialized.');
  return io;
};

exports.getIo = () => {
  if (!io) throw new Error('Socket.IO not initialized! Call init() first.');
  return io;
};
