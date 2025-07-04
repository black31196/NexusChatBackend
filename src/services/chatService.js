const messageModel = require('../models/messageModel');
const userModel    = require('../models/userModel');
const { getGfs } = require('../db/mongo');
const { Readable } = require('stream');

async function saveMessage(messageData) {
  return await messageModel.saveMessage(messageData);
}

async function fetchHistory({ from_user, to_user, limit }) {
  return messageModel.getHistory({ from_user, to_user, limit });
}

async function fetchConversations(userId) {
  return messageModel.getConversations(userId);
}
// new helper for your controller’s getMessages
async function fetchMessages(conversationId, userId, limit = 500) {
  return messageModel.getHistory({
    from_user:  userId,
    to_user:    conversationId,
    limit
  });
}

async function markAsRead(conversationId, userId) {
  return await messageModel.markAsRead(conversationId, userId);
}

async function saveImageToDB(imageBuffer, userId, contentType) {
  const gfs = getGfs();
  const readablePhotoStream = new Readable();
  readablePhotoStream.push(imageBuffer);
  readablePhotoStream.push(null);

  const filename = `line-image-${userId}-${Date.now()}`;
  const uploadStream = gfs.openUploadStream(filename, {
    contentType: contentType,
    metadata: { userId: userId },
  });

  // --- THIS IS THE KEY CHANGE ---
  // Get the ID directly from the stream object itself.
  // This is available immediately and is more reliable.
  const fileId = uploadStream.id.toString();

  readablePhotoStream.pipe(uploadStream);

  return new Promise((resolve, reject) => {
    uploadStream.on('error', (err) => {
      console.error('GridFS upload stream error:', err);
      reject(err);
    });

    // We no longer care about the payload of the 'finish' event.
    // We just need to wait for it to complete.
    uploadStream.on('finish', () => {
      console.log(`GridFS upload finished for fileId: ${fileId}`);
      // When it's done, resolve the promise with the ID we already have.
      resolve(fileId);
    });
  });
}

module.exports = {
  saveMessage,
  fetchHistory,
  fetchConversations,
  fetchMessages,
  markAsRead,
  saveImageToDB
};
