// api/routes/authRoutes.js

const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../../middlewares/auth'); // Optional: for getMe route

const router = express.Router();

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/me
router.get('/me', authMiddleware.protect, authController.getMe);

module.exports = router;
