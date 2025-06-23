// src/sockets/events.js
const chatService = require('../services/chatService');

module.exports = function registerChatEvents(socket, io) {

  // 1) Client tells us who they are
  socket.on('join', (userId) => {
    console.log(`[Socket.IO] socket ${socket.id} joining room ${userId}`);
    socket.join(userId);
  });

  // 2) Client sends a new chat message
  socket.on('send_message', async (msg, ack) => {
    console.log('[Socket.IO] send_message received', msg);
    try {
      // Persist to your DB
      const saved = await chatService.sendMessage({
        from:    msg.from,
        to:      msg.to,
        content: msg.content
      });
      // 2a) ACK back to sender so they can mark “sent”
      ack({ id: saved._id.toString(), timestamp: saved.timestamp });

      // 2b) Broadcast to the recipient’s room
      const outgoing = {
        id:             saved._id.toString(),
        conversationId: msg.to,           // or saved.conversationId
        from:           saved.from_user,
        to:             saved.to_user,
        content:        saved.content,
        timestamp:      saved.timestamp,
        status:         'delivered'
      };
      console.log('[Socket.IO] emitting receive_message to', msg.to, outgoing);
      io.to(msg.to).emit('receive_message', outgoing);

    } catch (err) {
      console.error('[Socket.IO] send_message error', err);
      // optionally ack error
      ack({ error: err.message });
    }
  });
};
