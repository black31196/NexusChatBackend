// src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const lineController= require('./controllers/lineController.js');
const { verifyLineSignature } = require('./middlewares/lineMiddleware');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// --- Main Middleware ---
app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "http://localhost:5000"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors({ origin: process.env.ALLOWED_ORIGINS.split(','), credentials: true }));
app.use(rateLimit({ windowMs: 60_000, max: 200, standardHeaders: true, legacyHeaders: false }));


// --- Special Route: LINE Webhook ---
// This route uses a raw body parser for signature verification and must come before any global JSON parser.
app.post(
  '/api/v1/line/webhook',
  express.raw({ type: 'application/json' }), // Use modern express.raw()
  (req, res, next) => {
    try {
      req.bodyJson = JSON.parse(req.body.toString('utf8'));
      next();
    } catch (err) {
      console.error('LINE webhook JSON parse failed', err);
      return res.status(400).send('Invalid JSON');
    }
  },
  lineController.handleWebhook
);


// --- THIS IS THE CORRECT ORDER ---

// 1. Register all your API routes first.
// The '/upload/image' route inside chatRoutes has its own 'multer' parser
// and will be correctly handled here, skipping the global parser below.
app.use('/api/v1/auth',  express.json(), authRoutes);
app.use('/api/v1/users', express.json(), userRoutes);
app.use('/api/v1/chat',  chatRoutes);

// 2. Use the global JSON parser. This will only apply to routes that
// were not handled above and have a 'Content-Type: application/json' header.

// ---------------------------------


// Final error handling middleware
app.use(errorHandler);

module.exports = app;