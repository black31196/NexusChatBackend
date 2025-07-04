// src/services/authService.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { JWT_SECRET, JWT_EXPIRES_IN = '12h' } = process.env;
async function register({ username, email, password, role }) {
  if (await userModel.findByUsername(username)) {
    const e = new Error('Username already taken'); e.status = 409; throw e;
  }
  const hash = await bcrypt.hash(password, 12);
  return userModel.createUser({ username, email, passwordHash: hash, role });
}
async function login({ username, password }) {
  const user = await userModel.findByUsername(username);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    const e = new Error('Invalid credentials'); e.status = 401; throw e;
  }
  const payload = { sub: user.id, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { token, user: { id: user.id, username: user.username, role: user.role } };
}
function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { const e = new Error('Invalid token'); e.status = 401; throw e; }
}
module.exports = { register, login, verifyToken };