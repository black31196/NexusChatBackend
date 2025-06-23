// src/services/userService.js
const userModel = require('../models/userModel');
async function getProfile(userId) { return userModel.findById(userId); }
async function setStatus(userId, status) {
  await userModel.updateStatus(userId, status); // implement in model
}
module.exports = { getProfile, setStatus };