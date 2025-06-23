// src/middlewares/lineMiddleware.js
const path   = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env.lineOA')
});
const crypto = require('crypto');

function verifyLineSignature(req, res, next) {
    
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) {
    console.error('LINE_CHANNEL_SECRET is not defined!');
    return res.status(500).send('Server configuration error');
  }

  const signature = req.get('x-line-signature') || '';
  const rawBody   = req.body;

  const hash = crypto
    .createHmac('SHA256', secret)
    .update(rawBody)
    .digest('base64');

  if (hash !== signature) {
    console.warn('LINE signature mismatch:', { hash, signature });
    return res.status(401).send('Unauthorized');
  }
  next();
}

module.exports = { verifyLineSignature };
