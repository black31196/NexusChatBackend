// src/models/messageModel.js
const mongoose = require('mongoose');

// 1. Define the Schema for your messages
const messageSchema = new mongoose.Schema({
  from_user: { type: String, required: true, index: true },
  to_user: { type: String, required: true, index: true },
  message_type: { type: String, required: true, enum: ['text', 'image', 'sticker'] },

  // Common fields
  read_at: { type: Date, default: null },
  timestamp: { type: Date, default: Date.now },
  client_id: { type: String, unique: true, sparse: true },

  // Optional fields
  content: { type: String }, // NOTE: Not required, as it's only for text messages
  file_id: { type: String },
  package_id: { type: String },
  sticker_id: { type: String },
});

// 2. Create a Mongoose Model from the Schema
// Mongoose will create a collection named 'messages' (plural and lowercase)
const Message = mongoose.model('Message', messageSchema);

// 3. Rewrite your functions to use the Mongoose Model

/**
 * Persist a new chat message.
 */
async function saveMessage(messageData) {
  const newMessage = new Message(messageData);
  return await newMessage.save();
}

/**
 * Fetch the two-way history between `from` and `to`, sorted oldest→newest.
 */
async function getHistory({ from_user, to_user, limit = 50 }) {
  return Message.find({
    $or: [
      { from_user: from_user, to_user: to_user },
      { from_user: to_user, to_user: from_user }
    ]
  })
  .sort({ timestamp: 1 })
  .limit(limit);
}

/**
 * List conversation summaries (latest message + unread count) for a user.
 */
async function getConversations(userId) {
  // .aggregate() is a static method on the model. .toArray() is not needed.
  return Message.aggregate([
    {
      $match: {
        $or: [
          { from_user: userId },
          { to_user: userId }
        ]
      }
    },
    {
      $project: {
        otherUser: {
          $cond: [
            { $eq: ['$from_user', userId] },
            '$to_user',
            '$from_user'
          ]
        },
        content: 1,
        timestamp: 1,
        read_at: 1,
        to_user: 1
      }
    },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$otherUser',
        lastMessage: { $first: '$content' },
        lastTimestamp: { $first: '$timestamp' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$to_user', userId] },
                  { $eq: ['$read_at', null] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        _id: 0, // Exclude the default _id field
        id: '$_id',
        participants: ['$_id'],
        lastMessage: { content: '$lastMessage', timestamp: '$lastTimestamp' },
        unreadCount: '$unreadCount'
      }
    }
  ]);
}

/**
 * Mark all messages in this convo as read by userId.
 */
async function markAsRead(conversationId, userId) {
  // .updateMany() is a static method on the model.
  return Message.updateMany(
    {
      // Filter documents
      $or: [
        { from_user: conversationId, to_user: userId },
        { from_user: userId, to_user: conversationId }
      ],
      to_user: userId,
      read_at: null
    },
    {
      // Update action
      $set: { read_at: new Date() }
    }
  );
}

/**
 * Convenience helper to fetch all messages in a conversation for a specific user.
 */
async function fetchMessages(conversationId, userId) {
    // This function can be improved to fetch messages between two specific users
    // which is what getHistory does. If you want ALL messages where a user is either
    // sender or receiver, the logic is different.
    // Assuming you want the history with one other person (the conversationId):
    return getHistory({ from_user: userId, to_user: conversationId, limit: 1000 }); // Reuse getHistory
}


module.exports = {
  saveMessage,
  getHistory,
  getConversations,
  markAsRead,
  fetchMessages,
  Message // Export the model itself for more advanced use if needed
};