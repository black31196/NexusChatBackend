// src/controllers/chatController.js
const { Readable } = require('stream'); // Import Node.js stream utility
const { asyncWrapper } = require('../middlewares/errorHandler');
const chatService = require('../services/chatService');
const { getGfs } = require('../db/mongo');
const mongoose = require('mongoose');
const line = require('@line/bot-sdk');


const lineConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};
const lineClient = new line.Client(lineConfig);

// --- TEXT MESSAGE CONTROLLER ---
exports.postMessage = asyncWrapper(async (req, res) => {
  const from_user = req.user.id;
  const { to_user, content, client_id } = req.body;

  const message = await chatService.saveMessage({
    from_user,
    to_user,
    content,
    client_id,
    message_type: 'text',
  });

  if (to_user.startsWith('U')) {
    try {
      await lineClient.pushMessage(to_user, { type: 'text', text: content });
      console.log('✅ Pushed text to LINE user', to_user);
    } catch (err) {
      console.error('❌ LINE pushMessage failed:', err);
    }
  }

  // WebSocket broadcast
  const io = req.app.get('io');
  const outgoing = { /* ... create the outgoing message object ... */ };
  io.to(from_user).emit('receive_message', outgoing); // Also emit to self for sync
  io.to(to_user).emit('receive_message', outgoing);

  res.status(201).json(message.toObject());
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
exports.getImage = async (req, res) => {
  try {
    const gfs = getGfs();
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    const file = (await gfs.find({ _id: fileId }).toArray())[0];

    if (!file) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.set('Content-Type', file.contentType);
    const downloadStream = gfs.openDownloadStream(fileId);
    downloadStream.pipe(res);
  } catch (err) {
    res.status(404).json({ error: 'Image not found' });
  }
};

exports.uploadImageMessage = asyncWrapper(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided.' });
  }

  const { buffer, originalname, mimetype } = req.file;
  const { to_user } = req.body;
  const from_user = process.env.DEFAULT_AGENT_ID
  const gfs = getGfs();
  // 1. Open an upload stream to GridFS and give it a filename
  const uploadStream = gfs.openUploadStream(originalname, {
    contentType: mimetype,
    metadata: { from_user, to_user }
  });

  const fileId = uploadStream.id.toString();
  // 2. Create a readable stream from the file buffer in memory
  const readableStream = new Readable();
  readableStream.push(buffer);
  readableStream.push(null); // Signal that we're done pushing data
  readableStream.pipe(uploadStream);

  // 4. Handle errors during the upload
  uploadStream.on('error', (err) => {
    console.error('Error uploading to GridFS:', err);
    res.status(500).json({ error: 'Failed to upload file.' });
  });

  // 5. When the upload is finished, save the message and notify LINE
   uploadStream.on('finish', async () => {
    console.log(`✅ GridFS upload finished for fileId: ${fileId}`);
    try {
      // 5. Save the message record to your database
      const savedMessage = await chatService.saveMessage({
        from_user,
        to_user,
        message_type: 'image',
        file_id: fileId,
      });

      const imageUrl = `${process.env.BACKEND_URL}/api/v1/chat/image/${fileId}`;
      if (to_user && to_user.startsWith('U')) {
        console.log("imageUrl:", imageUrl);
        console.log ("backendurl:", process.env.BACKEND_URL);
        await lineClient.pushMessage(to_user, {
          type: 'image',
          originalContentUrl: imageUrl,
          previewImageUrl: imageUrl,
        });
      }
      
      console.log('✅ Successfully processed and saved image.');
      // Respond to the frontend
      res.status(201).json(savedMessage.toObject());
    } catch(err) {
      console.error('Error saving message after file upload:', err);
      res.status(500).json({ error: 'Server error after successful upload.' });
    }
  });
});

/*
exports.uploadImageMessage = async (req, res) => {

  console.log('--- [DEBUG] Inside uploadImageMessage ---');
  console.log('req.body:', req.body);
  console.log('req.file:', req.file);
  console.log('req.files:', req.files);
  console.log('req.user:', req.user);
  console.log('req.file._id:', req.file._id);
  console.log('req.file.filename:', req.file.filename);
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }
  

  const { to_user } = req.body;
  const from_user = req.user.id;
  const fileId = req.file._id.toString();

  // 1. Save message record to your database
  const savedMessage = await chatService.saveMessage({
    from_user,
    to_user,
    message_type: 'image',
    file_id: fileId,
  });

  // 2. Create the public URL for the image
  const imageUrl = `${process.env.BACKEND_URL}/api/v1/chat/image/${fileId}`;

  // 3. Send the image to the LINE user
  if (to_user.startsWith('U')) {
    try {
      await lineClient.pushMessage(to_user, {
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl,
      });
    } catch (err) {
      console.error('❌ LINE pushMessage for image failed:', err);
    }
  }
  
  // 4. Respond to your frontend
  res.status(201).json(savedMessage.toObject());
};
*/
