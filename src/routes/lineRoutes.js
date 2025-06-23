// src/routes/lineRoutes.js
const express = require('express');
const { verifyLineSignature } = require('../middlewares/lineMiddleware');
const lineController = require('../controllers/lineController.js');

const router = express.Router();

router.post(
  '/webhook',
  verifyLineSignature,
  lineController.handleWebhook
);

module.exports = router;
