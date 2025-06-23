// src/models/userModel.js
const { query }   = require('../db/postgres');
const { v4: uuidv4 } = require('uuid');

async function createUser({ username, email, passwordHash, role = 'user' }) {
  // generate a new ID, but it will only be used on INSERT
  const id = uuidv4();
  const text = `
    INSERT INTO users (id, username, email, password_hash, role, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (username) DO UPDATE
      SET
        email         = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        role          = EXCLUDED.role
    RETURNING id, username, email, role, created_at;
  `;
  const params = [id, username, email, passwordHash, role];
  const { rows } = await query(text, params);
  return rows[0];
}

async function findByUsername(username) {
  const { rows } = await query(
    'SELECT id, username, email, role, password_hash, created_at FROM users WHERE username = $1',
    [username]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await query(
    'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
}
module.exports = { createUser, findByUsername, findById };