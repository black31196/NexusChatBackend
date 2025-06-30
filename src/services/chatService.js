const messageModel = require('../models/messageModel');
const userModel    = require('../models/userModel');

async function sendMessage({ from_user, to_user, content }) {
  const timestamp = new Date();
  const saved = await messageModel.saveMessage({ from_user, to_user, content, timestamp });
  return saved;
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

module.exports = {
  sendMessage,
  fetchHistory,
  fetchConversations,
  fetchMessages,
  markAsRead
};
