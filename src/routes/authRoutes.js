// src/routes/authRoutes.js
const r = require('express').Router();
const auth = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../schemas/authSchemas');
const c = require('../controllers/authController');

r.post(
    '/register', 
    validateBody(registerSchema), 
    c.register
);

r.post(
    '/login', 
    validateBody(loginSchema), 
    c.login
);

//Returns current user’s profile
r.get(
  '/me',
  auth,
  c.getProfile
);
module.exports = r;