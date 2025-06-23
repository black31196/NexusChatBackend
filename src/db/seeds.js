// src/db/seeds.js
const path      = require('path');
const bcrypt    = require('bcrypt');
const userModel = require('../models/userModel');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path: path.resolve(__dirname, '../.env.postgres'),
  });
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function seedAdminUser() {
  // 1) Check for existing
  const existing = await userModel.findByUsername(ADMIN_USERNAME);
  if (existing) {
    console.log('✅ Admin user already exists, ID =', existing.id || existing._id);
    return existing;
  }

  // 2) Hash the password
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // 3) Create with role='admin'
  const newAdmin = await userModel.createUser({
    username:     ADMIN_USERNAME,
    email:        ADMIN_EMAIL,
    passwordHash,
    role:         'admin'
  });

  console.log('🆕 Seeded admin user:', newAdmin);
  return newAdmin;
}

module.exports = { seedAdminUser };
