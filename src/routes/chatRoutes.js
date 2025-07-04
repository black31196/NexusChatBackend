// src/routes/chatRoutes.js

const express = require('express');
const router  = express.Router();
const auth = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const chatController   = require('../controllers/chatController');
const upload = require('../middlewares/uploadMiddleware');
const { 
  sendMessageSchema,
  historyQuerySchema 
} = require('../schemas/chatSchemas');
const jsonParser = express.json();
// --------------------------------------------------------------------


// The '/send' route needs to parse a JSON body before validating it.
router.post(
  '/send',
  auth,
  jsonParser, // <-- ADDED: Use the JSON parser
  validateBody(sendMessageSchema),
  chatController.postMessage
);

// The '/upload/image' route needs to parse multipart/form-data for the file.

router.post(
  '/upload/image',
  //auth, // <-- Ensure this is enabled
  upload.single('image'),
  chatController.uploadImageMessage
);
/*
router.post(
  '/upload/image',
  //auth,
  console.log ("upload image route"),
  
  // This temporary controller runs AFTER multer
  (req, res) => {
    console.log('--- [DEBUG] After Multer Middleware ---');
    console.log('Has multer populated req.file?', req.file);
    console.log('Has multer populated req.body?', req.body);
    console.log('-------------------------------------');

    if (req.file) {
      // If we get here, it means multer WORKED!
      res.status(200).json({ 
        message: "SUCCESS: Multer processed the file!",
        fileDetails: req.file 
      });
    } else {
      // If we get here, multer ran but failed to find the file.
      res.status(400).json({ error: "FAILURE: Multer ran but req.file is still undefined." });
    }
  }
);
*/

// This route likely has no body, but we add the parser for correctness.
router.post(
  '/:conversationId/read',
  auth,
  jsonParser, // <-- ADDED: Use the JSON parser
  chatController.markRead
);

// Your GET routes do not need body parsers.
router.get('/image/:fileId', chatController.getImage);
router.get('/history', auth, chatController.getHistory);
router.get('/conversations', auth, chatController.getConversations);
router.get('/:conversationId/messages', auth, chatController.getMessages);

module.exports = router;