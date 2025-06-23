// src/routes/userRoutes.js
const express = require('express');
const auth = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const Joi = require('joi');
const userController = require('../controllers/userController');

const statusSchema = Joi.object({
  status: Joi.string()
    .valid('online', 'offline', 'busy')
    .required(),                               // ⬆️ CHANGED: validateBody on /status
});

const router = express.Router();

router.get(
  '/me',
  auth,
  userController.getProfile
);

router.put(
  '/status',
  auth,
  validateBody(statusSchema),                 // ⬆️ CHANGED: apply validation
  userController.setStatus
);

module.exports = router;
