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

// Route to get an image by its ID
router.get('/image/:fileId', chatController.getImage);

// Route to upload an image and send it
router.post('/upload/image', auth, chatController.uploadImageMessage);

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