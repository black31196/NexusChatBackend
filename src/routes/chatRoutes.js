// src/routes/chatRoutes.js
const express = require('express');
const router  = express.Router();
const auth = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const chatController   = require('../controllers/chatController');
const { 
  sendMessageSchema,
  historyQuerySchema 
} = require('../schemas/chatSchemas');

router.post(
  '/send',
  auth,
  validateBody(sendMessageSchema),
  chatController.postMessage
);

router.post(
  '/:conversationId/read',
  auth,
  chatController.markRead
);


router.get(
  '/history',
  auth,
  chatController.getHistory
);

// GET /api/v1/chat/conversations
router.get(
  '/conversations',
  auth,
  chatController.getConversations
);

router.get(
  '/:conversationId/messages',
  auth,
  chatController.getMessages
);

module.exports = router;