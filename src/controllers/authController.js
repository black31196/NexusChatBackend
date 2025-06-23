// src/controllers/authController.js
const { asyncWrapper } = require('../middlewares/errorHandler');
const s = require('../services/authService');
const userModel = require('../models/userModel');
exports.register = asyncWrapper(async (req, res) => { 
    const user = await s.register(req.body); 
    res.status(201).json({ user }); 
});

exports.login = asyncWrapper(async (req, res) => { 
    const result = await s.login(req.body); 
    res.json(result); 
});

// GET /api/v1/auth/me
exports.getProfile = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  // Fetch the user from DB (this returns id, username, email, role, created_at)
  const user = await userModel.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  // Return only the safe fields
  res.json({
    id:       user.id,
    username: user.username,
    role:     user.role
  });
});