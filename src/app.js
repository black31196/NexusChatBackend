// src/app.js
const express       = require('express');
const helmet        = require('helmet');
const cors          = require('cors');
const rateLimit     = require('express-rate-limit');
const bodyParser    = require('body-parser');
const path          = require('path');

const authRoutes    = require('./routes/authRoutes');
const userRoutes    = require('./routes/userRoutes');
const chatRoutes    = require('./routes/chatRoutes');
const lineController= require('./controllers/lineController.js');
const { verifyLineSignature } = require('./middlewares/lineMiddleware');
const { errorHandler } = require('./middlewares/errorHandler');

{/*
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({path: path.resolve(__dirname, './.env.lineOA')});
}
*/
}
//const lineWebhookRoutes = require('./api/routes/lineWebhookRoutes.js');

const app = express();

// ─── Trust proxy for rate-limit if you’re behind ngrok/etc ───────────────────
app.set('trust proxy', 1);

// ─── Security/CORS/Rate-Limit ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "http://localhost:5000"],
      },
    },
    
    // --- THIS IS THE FINAL FIX ---
    // This changes the header from 'same-origin' to 'cross-origin',
    // which is required to allow your frontend on port 3000 to
    // display images served from your backend on port 5000.
    crossOriginResourcePolicy: { policy: "cross-origin" },

  })
);
app.use(cors({ origin: process.env.ALLOWED_ORIGINS.split(','), credentials: true }));
app.use(rateLimit({ windowMs: 60_000, max: 200, standardHeaders: true, legacyHeaders: false }));

console.log('Loaded LINE secret:', !!process.env.LINE_CHANNEL_SECRET);
// ─── LINE WEBHOOK: raw parser → signature check → JSON-parse → controller ───

app.post(
  '/api/v1/line/webhook',
  bodyParser.raw({ type: 'application/json' }),     // 👈 exact bytes in req.body (Buffer)
  // verifyLineSignature,                              // 👈 compares HMAC(Buffer) vs header
  (req, res, next) => {                             // 👈 parse Buffer → JS object
    try {
      // stash the parsed body on req for your controller
      req.bodyJson = JSON.parse(req.body.toString('utf8'));
    } catch (err) {
      console.error('LINE webhook JSON parse failed', err);
      return res.status(400).send('Invalid JSON');
    }
    next();
  },
  lineController.handleWebhook                      // 👈 uses req.bodyJson
);


// ─── All other routes get the normal JSON parser ─────────────────────────────
app.use(bodyParser.json());
//app.use('/api/v1/line', lineWebhookRoutes);
app.use('/api/v1/auth',  authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chat',  chatRoutes);

app.use(errorHandler);

module.exports = app;
