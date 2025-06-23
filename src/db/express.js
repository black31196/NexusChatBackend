// models/express.js
const path = require('path');
const logger = require('../utils/logger');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path: path.resolve(__dirname, '../.env.express')
  });
}

module.exports = {
  port:           parseInt(process.env.PORT, 10) || 3000,
  allowedOrigin:  process.env.ALLOWED_ORIGIN,
  sessionSecret:  process.env.SESSION_SECRET,
  NODE_ENV: process.env.NODE_ENV,
};
