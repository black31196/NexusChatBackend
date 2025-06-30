// src/controllers/lineController.js
const chatSvc = require('../services/chatService');
exports.handleWebhook = async (req, res) => {
  const body = req.bodyJson;  // parsed in the previous middleware
  const io   = req.app.get('io');

  await Promise.all(
    body.events.map(async (event) => {
      console.log('[LINE webhook] received event:', event);
      if (event.type !== 'message') {
        return Promise.resolve(null);
      }
        const { message } = event;

        const from_user    = event.source.userId;                     // LINE user
        const content = event.message.text;
        const to_user      = process.env.DEFAULT_AGENT_ID;
        const saved  = await chatSvc.sendMessage({ from_user, to_user, content });
        const outgoing = {
          id:             saved._id.toString(),
          conversationId: from_user,            // opens the convo with the LINE user
          from_user:      saved.from_user, // LINE user id
          to_user:        saved.to_user,   // your agent’s id
          content:        saved.content,
          timestamp:      saved.timestamp.toISOString(),
          status:         'delivered'
        };

       switch (message.type) {
        case 'text':
        console.log('[LINE webhook] emitting receive_message →', outgoing);
        io.to(to_user).emit('receive_message', outgoing);
        break;
      
        case 'image':
        console.log('[LINE webhook] emitting receive_image →', outgoing);
        await handleImageMessage(message.id, userId);
        io.to(to_user).emit('receive_image', outgoing);
        break;

        case 'sticker':
        console.log('[LINE webhook] emitting receive_sticker →', outgoing);
        io.to(to_user).emit('receive_sticker', outgoing);
        break;
        }
    })
  );

  // 200 OK to LINE
  res.sendStatus(200);
};