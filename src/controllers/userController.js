// src/controllers/userController.js
const { asyncWrapper } = require('../middlewares/errorHandler');
const userService = require('../services/userService');

exports.getProfile = asyncWrapper(async (req, res) => {
  const profile = await userService.getProfile(req.user.id);
  res.json({ user: profile });
});

exports.setStatus = asyncWrapper(async (req, res) => {
  const { status } = req.body;                 // ⬆️ CHANGED: pull status from validated body
  await userService.setStatus(req.user.id, status);
  res.json({ status });
});
