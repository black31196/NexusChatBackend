// api/routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');

// GET /api/
router.get('/', (req, res) => {
  res.status(200).json({
    system: 'FB Ads Management API',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// GET /api/system/ping
router.get('/ping', (req, res) => {
  res.status(200).send('pong');
  logger.info('Ping endpoint tested successfully');
});

module.exports = router;