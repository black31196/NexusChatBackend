// src/controllers/chatController.js
const { asyncWrapper } = require('../middlewares/errorHandler');
const chatService = require('../services/chatService');
const line      = require('@line/bot-sdk');
const path      = require('path');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path: path.resolve(__dirname, '../.env.lineOA')
  });
}

const lineConfig = {
  channelSecret:      process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};
const lineClient = new line.Client(lineConfig);

exports.postMessage = asyncWrapper(async (req, res) => {
  const from_user = req.user.id;                             
  const { to_user, content } = req.body;
 
  const message = await chatService.sendMessage({ from_user, to_user, content }); 
  if (to_user.startsWith('U')) {
    try {
      await lineClient.pushMessage(to_user, { type:'text', text: content });
      console.log('✅ Pushed to LINE user', to_user);
    } catch (err) {
      console.error('❌ LINE pushMessage failed:', err);
    }
  }
  // 3) WebSocket broadcast
   const io = req.app.get('io');
   io.to(to_user).emit('receive_message', {
    id:             message._id.toString(),
    conversationId: message.to_user,
    from_user:           message.from_user,
    to_user:             message.to_user,
    content:        message.content,
    timestamp:      message.timestamp,
    status:         'delivered'
   });

   // 4) HTTP response
   res.status(201).json({
    ...message.toObject(),
    status: 'sent'
   });
 });

exports.getHistory = asyncWrapper(async (req, res) => {
  const from_user = req.user.id;                             
  const { to_user, limit = 50 } = req.query;                 
  const history = await chatService.fetchHistory({        
    from_user,
    to_user,
    limit: parseInt(limit, 10)                        
  });
  res.json({ history });                                
});

exports.getConversations = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const convos = await chatService.fetchConversations(userId);
  console.log('[chatController.getConversations] returning:', JSON.stringify(convos, null, 2));
  res.json(convos);
});

// src/controllers/chatController.js
exports.getMessages = asyncWrapper(async (req, res) => {
  const otherId = req.params.conversationId;
  const myId    = req.user.id;
  console.log('getMessages for', { from_user: myId, to_user: otherId });
  const msgs    = await chatService.fetchMessages(otherId, myId);
  res.json(msgs);
  console.log('Fetched messages:', msgs.length, 'messages for', { from_user: myId, to_user: otherId });
});

exports.markRead = asyncWrapper(async (req, res) => {
  console.log('[chatController.markRead] params:', req.params);
  await chatService.markAsRead(req.params.conversationId, req.user.id);
  console.log('[chatController.markRead] done');
  res.sendStatus(204);
});


