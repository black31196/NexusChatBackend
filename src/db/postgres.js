// src/db/postgres.js
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env.postgres')
});

const connectionString = process.env.POSTGRES_URI || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Missing Postgres connection string. Please set POSTGRES_URI or DATABASE_URL in .env.postgresql');
}
const pool = new Pool({ 
  connectionString,
  ssl: {
    rejectUnauthorized:false
  }
});

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

const initpostgres = require('./initpostgredb');
async function initPostgres() {
  console.log('✔️ PostgreSQL connected, running migrations…');
  await initpostgres(pool);
  console.log('✔️ PostgreSQL schema setup complete');
}

module.exports = { query, initPostgres };
