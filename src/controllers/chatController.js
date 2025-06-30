// src/controllers/chatController.js
const { asyncWrapper } = require('../middlewares/errorHandler');
const chatService = require('../services/chatService');
const { Message } = require('../models/messageModel');
const { getGfs } = require('../db/mongo');
const mongoose = require('mongoose');
const line      = require('@line/bot-sdk');
const path      = require('path');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path: path.resolve(__dirname, '../.env.lineOA')
  });
  require('dotenv').config({
    dbpath: path.resolve(__dirname, '../.env.mongodb')
  });
}

// --- multer and lineClient config ---
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const { url } = require('inspector');

const storage = new GridFsStorage({
  url: `${process.env.MONGO_URI}/${process.env.MONGO_DB_NAME}`,
  file: (req, file) => {
    return {
      bucketName: 'uploads',
      filename: `user-upload-${Date.now()}-${file.originalname}`
    };
  }
});
const upload = multer({ storage });

const lineConfig = {
  channelSecret:      process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};
const lineClient = new line.Client(lineConfig);

exports.postMessage = asyncWrapper(async (req, res) => {
  const from_user = req.user.id;                             
  const { to_user, content, client_id } = req.body;
 
  const message = await chatService.saveMessage({
    from_user,
    to_user,
    content,
    client_id, // Pass the idempotency key if you have it
    message_type: 'text', // <-- ADD THIS REQUIRED FIELD
  }); 
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

// ROUTE: GET /api/v1/chat/image/:fileId
exports.getImage = asyncWrapper(async (req, res) => {
  const gfs = getGfs();
  const fileId = new mongoose.Types.ObjectId(req.params.fileId);
  
  const files = await gfs.find({ _id: fileId }).toArray();
  if (!files || files.length === 0) {
    return res.status(404).json({ error: 'File not found' });
  }

  const file = files[0];
  res.set('Content-Type', file.contentType);

  const downloadStream = gfs.openDownloadStream(fileId);
  downloadStream.pipe(res);
});
// NEW ENDPOINT 2: Uploads an image, saves it, and sends to LINE
// ROUTE: POST /api/v1/chat/upload/image
// This uses multer as middleware, which is why 'upload.single' is here.
exports.uploadImageMessage = [
  upload.single('image'), // 'image' must be the field name in the FormData
  asyncWrapper(async (req, res) => {
    // 1. Get data from request
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }
    const { to_user } = req.body; // The LINE user ID to send to
    const from_user = req.user.id; // The agent's ID
    const fileId = req.file.id.toString();

    // 2. Construct the public URL for the image
    const imageUrl = `${process.env.BACKEND_URL}/api/v1/chat/image/${fileId}`;

    // 3. Send the image message to LINE
    try {
      await lineClient.pushMessage(to_user, {
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl,
      });
      console.log('✅ Pushed image to LINE user', to_user);
    } catch (err) {
      console.error('❌ LINE pushMessage for image failed:', err.originalError.response.data);
      // Even if LINE fails, we still save it to our history.
    }
    // 4. Save a record of the image message to our own database
    const messageData = {
      from_user,
      to_user,
      message_type: 'image',
      file_id: fileId,
    };
    const savedMessage = await chatService.saveMessage(messageData); // Assuming you have this service function

    // 5. Send success response to the frontend
    res.status(201).json({
      message: 'Image sent successfully',
      ...savedMessage.toObject()
    });
  })
];

