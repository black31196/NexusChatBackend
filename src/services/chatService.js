const messageModel = require('../models/messageModel');
const userModel    = require('../models/userModel');

async function sendMessage({ from, to, content }) {
  const timestamp = new Date();
  const saved = await messageModel.saveMessage({ from_user: from, to_user: to, content, timestamp });
  return saved;
}

async function fetchHistory({ from, to, limit }) {
  return messageModel.getHistory({ from, to, limit });
}

async function fetchConversations(userId) {
  return messageModel.getConversations(userId);
}
// new helper for your controller’s getMessages
async function fetchMessages(conversationId, userId, limit = 500) {
  return messageModel.getHistory({
    from:  userId,
    to:    conversationId,
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
