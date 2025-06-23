// models/initpostgredb.js
// Script to initialize PostgreSQL schema via a provided pool instance, using triggers for Buddhist timestamp fields

const logger = require('../utils/logger');

const initPostgres = async (pool) => {
  const client = await pool.connect();
  logger.info('✅ Initializing PostgreSQL schema...');

  try {
    // Start transaction
    await client.query('BEGIN');

    // Enable pgcrypto for UUIDs
    logger.info('🔧 Enabling pgcrypto extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // Use Bangkok timezone
    logger.info('🕑 Setting timezone to Asia/Bangkok...');
    await client.query("SET TIME ZONE 'Asia/Bangkok';");

    // Drop existing tables
    logger.info('🚀 Dropping existing tables if they exist...');
    //await client.query('DROP TABLE IF EXISTS attachments, assignments, agent_status, users CASCADE;');

    // 1) users table
    logger.info('📦 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        email TEXT,
        password_hash TEXT NOT NULL,
        role TEXT CHECK (role IN ('agent','admin','line_user','supervisor','superadmin')),
        line_user_id TEXT UNIQUE,
        nickname TEXT,
        created_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')
      );
    `);

    // 2) agent_status table
    logger.info('📦 Creating agent_status table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_status (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        is_online BOOLEAN DEFAULT FALSE,
        is_available BOOLEAN DEFAULT TRUE,
        last_updated TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')
      );
    `);

    // 3) assignments table
    logger.info('📦 Creating assignments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        line_user_id TEXT PRIMARY KEY REFERENCES users(line_user_id) ON DELETE CASCADE,
        agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'),
        assigned_at_buddhist TEXT
      );
    `);

    // 4) attachments table
    logger.info('📦 Creating attachments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_name TEXT,
        file_type TEXT,
        file_size BIGINT,
        url TEXT,
        uploaded_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok')
      );
    `);

    // Commit
    await client.query('COMMIT');
    logger.info('✅ PostgreSQL schema initialized successfully with triggers.');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('❌ Error initializing PostgreSQL database:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = initPostgres;