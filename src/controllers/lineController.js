// src/controllers/lineController.js
const chatService = require('../services/chatService');
const line = require('@line/bot-sdk');
const path = require('path');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path: path.resolve(__dirname, '../.env.lineOA')
  });
}
const lineConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};
const lineClient = new line.Client(lineConfig);


// Helper function to get image buffer from LINE
const fetchImageBufferFromLine = async (messageId) => {
    const stream = await lineClient.getMessageContent(messageId);
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
};


exports.handleWebhook = async (req, res) => {
  const body = req.bodyJson;
  const io = req.app.get('io');

  await Promise.all(
    body.events.map(async (event) => {
      console.log('[LINE webhook] received event:', event);
      if (event.type !== 'message') {
        return Promise.resolve(null);
      }

      const { message } = event;
      const from_user = event.source.userId;
      const to_user = process.env.DEFAULT_AGENT_ID;

      let savedMessage; // Declare this once, outside the switch

      // --- STEP 1: Save the message based on its type ---
      // The `savedMessage` variable will be populated here.
      switch (message.type) {
        case 'text':
          savedMessage = await chatService.saveMessage({
            from_user: from_user,
            to_user: to_user,
            content: message.text,
            message_type: 'text',
          });
          break;

        case 'image':
          try {
            const imageBuffer = await fetchImageBufferFromLine(message.id);
            
            // --- THIS IS THE FIX ---
            // 1. The variable is now 'fileId', as the service returns a string.
            const fileId = await chatService.saveImageToDB(imageBuffer, from_user, 'image/jpeg');
            
            // 2. We can now use fileId directly.
            savedMessage = await chatService.saveMessage({
                from_user: from_user,
                to_user: to_user,
                message_type: 'image',
                file_id: fileId // No more '.id' or '.toString()' needed
            });
          } catch(err) {
            console.error("Failed to process incoming image from LINE:", err);
          }
          break;

        case 'sticker':
          savedMessage = await chatService.saveMessage({
            from_user: from_user,
            to_user: to_user,
            message_type: 'sticker',
            package_id: message.packageId,
            sticker_id: message.stickerId,
          });
          break;

        default:
          return Promise.resolve(null);
      }

      // --- STEP 2: If a message was saved, create the outgoing object and broadcast it ---
      // This block now runs AFTER the switch, and only if a message was successfully saved.
      if (savedMessage) {
        // Now 'outgoing' is defined before it's used.
        const outgoing = {
          id: savedMessage._id.toString(),
          conversationId: from_user, // The conversation ID is the LINE user's ID
          from_user: savedMessage.from_user,
          to_user: savedMessage.to_user,
          message_type: savedMessage.message_type,
          content: savedMessage.content,
          file_id: savedMessage.file_id,
          package_id: savedMessage.package_id,
          sticker_id: savedMessage.sticker_id,
          timestamp: savedMessage.timestamp.toISOString(),
          status: 'delivered',
        };

        // Emit to the agent's room, which is identified by the agent's ID
        io.to(to_user).emit('receive_message', outgoing);
        console.log(`[LINE webhook] Emitted 'receive_message' to agent ${to_user}:`, outgoing);
      }
    })
  );

  // Send 200 OK to LINE immediately
  res.sendStatus(200);
};