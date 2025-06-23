// /src/db/initpostgredb.js
// Script to initialize PostgreSQL schema via a provided pool instance

const logger = require('../../utils/logger');

const initpostgres = async (pool) => {
  const client = await pool.connect();
  logger.info('✅ Initializing PostgreSQL schema...');

  try {
    // Start a transaction
    await client.query('BEGIN');

    logger.info('🔧 Enabling pgcrypto extension...');
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    `);

    logger.info('🕑 Setting timezone to Asia/Bangkok...');
    await client.query("SET TIME ZONE 'Asia/Bangkok';");

    logger.info('🚀 Dropping existing tables if they exist...');
    await client.query(`
      DROP TABLE IF EXISTS attachments, assignments, agent_status, users CASCADE;
    `);

    logger.info('📦 Creating users table...');
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT,
        email TEXT,
        password_hash TEXT,
        role TEXT CHECK (role IN ('agent', 'admin', 'line_user')),
        line_user_id TEXT UNIQUE,
        nickname TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at_buddhist TEXT GENERATED ALWAYS AS (
          (EXTRACT(YEAR FROM created_at AT TIME ZONE 'Asia/Bangkok') + 543)::text
          || to_char(created_at AT TIME ZONE 'Asia/Bangkok', '-MM-DD HH24:MI:SS')
        ) STORED
      );
    `);

    logger.info('📦 Creating agent_status table...');
    await client.query(`
      CREATE TABLE agent_status (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        is_online BOOLEAN DEFAULT FALSE,
        is_available BOOLEAN DEFAULT TRUE,
        last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_updated_buddhist TEXT GENERATED ALWAYS AS (
          (EXTRACT(YEAR FROM last_updated AT TIME ZONE 'Asia/Bangkok') + 543)::text
          || to_char(last_updated AT TIME ZONE 'Asia/Bangkok', '-MM-DD HH24:MI:SS')
        ) STORED
      );
    `);

    logger.info('📦 Creating assignments table...');
    await client.query(`
      CREATE TABLE assignments (
        line_user_id TEXT PRIMARY KEY REFERENCES users(line_user_id) ON DELETE CASCADE,
        agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        assigned_at_buddhist TEXT GENERATED ALWAYS AS (
          (EXTRACT(YEAR FROM assigned_at AT TIME ZONE 'Asia/Bangkok') + 543)::text
          || to_char(assigned_at AT TIME ZONE 'Asia/Bangkok', '-MM-DD HH24:MI:SS')
        ) STORED
      );
    `);

    logger.info('📦 Creating attachments table...');
    await client.query(`
      CREATE TABLE attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_name TEXT,
        file_type TEXT,
        file_size BIGINT,
        url TEXT,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        uploaded_at_buddhist TEXT GENERATED ALWAYS AS (
          (EXTRACT(YEAR FROM uploaded_at AT TIME ZONE 'Asia/Bangkok') + 543)::text
          || to_char(uploaded_at AT TIME ZONE 'Asia/Bangkok', '-MM-DD HH24:MI:SS')
        ) STORED
      );
    `);

    // Commit the transaction
    await client.query('COMMIT');
    logger.info('✅ PostgreSQL schema initialized successfully.');
  } catch (err) {
    // Rollback on error
    await client.query('ROLLBACK');
    logger.error('❌ Error initializing PostgreSQL database:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = initpostgres;