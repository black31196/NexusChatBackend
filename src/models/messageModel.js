// src/models/messageModel.js

const { connectToMongo } = require('../db/mongo');

/**
 * Persist a new chat message.
 */
async function saveMessage({ from_user, to_user, content, timestamp }) {
  const db = await connectToMongo();
  const doc = { from_user, to_user, content, timestamp, read_at: null };
  const result = await db.collection('messages').insertOne(doc);
  return { _id: result.insertedId, ...doc };
}

/**
 * Fetch the two-way history between `from` and `to`, sorted oldest→newest.
 */
async function getHistory({ from_user, to_user, limit = 50 }) {
  const db = await connectToMongo();
  return db
    .collection('messages')
    .find({
      $or: [
        { from_user:from_user, to_user:to_user},
        { from_user: to_user, to_user: from_user }
      ]
    })
    .sort({ timestamp: 1 })
    .limit(limit)
    .toArray();
}

/**
 * List conversation summaries (latest message + unread count) for a user.
 */
async function getConversations(userId) {
  const db = await connectToMongo();
  return db
    .collection('messages')
    .aggregate([
      { $match: { $or: [
          { from_user: userId },
          { to_user:   userId }
        ] }
      },
      { $project: {
          otherUser: {
            $cond: [
              { $eq: [ '$from_user', userId ] },
              '$to_user',
              '$from_user'
            ]
          },
          content:   1,
          timestamp: 1,
          read_at:   1,
          to_user:   1
        }
      },
      { $sort: { timestamp: -1 } },
      { $group: {
          _id:           '$otherUser',
          lastMessage:   { $first: '$content' },
          lastTimestamp: { $first: '$timestamp' },
          unreadCount: {
          $sum: {
            $cond: [
              { $and: [
                  { $eq: [ '$to_user',  userId ] },
                  
                  { $eq: [ '$read_at',  null   ] }    // ← use read_at
                ]
              },
              1,
              0
            ]
          }
        }
        }
      },
      { $project: {
          id:           '$_id',
          participants: ['$_id'],
          lastMessage:  { content: '$lastMessage', timestamp: '$lastTimestamp' },
          unreadCount:  '$unreadCount'
        }
      }
    ])
    .toArray();
}

/**
 * Mark all messages in this convo as read by userId.
 */
async function markAsRead(conversationId, userId) {
  const db = await connectToMongo();
  await db
    .collection('messages')
    .updateMany(
      {
        $or: [
          { from_user: conversationId, to_user: userId },
          { from_user: userId,         to_user: conversationId }
        ],
        to_user: userId,
        read_at: null
      },
      { $set: { read_at: new Date() } }
    );
}

/**
 * Convenience helper to fetch all messages in a conversation.
 */
async function fetchMessages(conversationId) {
  const db = await connectToMongo();
  return db
    .collection('messages')
    .find({
      $or: [
        { from_user: conversationId },
        { to_user:   conversationId }
      ]
    })
    .sort({ timestamp: 1 })
    .toArray();
}

module.exports = {
  saveMessage,
  getHistory,
  getConversations,
  markAsRead,
  fetchMessages
};
