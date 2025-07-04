// src/middlewares/uploadMiddleware.js
const multer = require('multer');

// Use multer's built-in memory storage engine.
// This holds the uploaded file as a buffer in memory.
const storage = multer.memoryStorage();

// You can add limits here for security, e.g., a 10MB limit
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

module.exports = upload;