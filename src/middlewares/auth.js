// src/middlewares/auth.js
const { verifyToken } = require('../services/authService');

module.exports = function auth(req, res, next) {
  const authHeader = req.get('Authorization') || '';
  const token      = authHeader.replace(/^Bearer\s+/, '');
  if (!token) return res.status(401).json({ message: 'No token' });

  // verifyToken should return your payload { sub, role }
  const payload = verifyToken(token);
  // map that sub → id so downstream code can do req.user.id
  req.user = {
    id:   payload.sub,
    role: payload.role
  };
  next();
};
