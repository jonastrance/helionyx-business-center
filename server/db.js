import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export let pool = null;
export let dbOnline = false;

export async function initDB() {
  const connStr = process.env.DATABASE_URL;
  const hasConfig = connStr || process.env.PGDATABASE;

  if (!hasConfig) {
    console.log('⚠️  No DATABASE_URL in .env — running in localStorage-only mode');
    return;
  }

  try {
    pool = new Pool(
      connStr
        ? { connectionString: connStr }
        : {
            host: process.env.PGHOST || 'localhost',
            port: process.env.PGPORT || 5432,
            database: process.env.PGDATABASE || 'helionyx',
            user: process.env.PGUSER || 'postgres',
            password: process.env.PGPASSWORD,
          }
    );

    await pool.query('SELECT 1');
    dbOnline = true;
    console.log('✅ PostgreSQL connected');
    await createSchema();
  } catch (err) {
    console.log(`⚠️  PostgreSQL unavailable (${err.message}) — localStorage fallback active`);
    pool = null;
    dbOnline = false;
  }
}

async function createSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS thoughts (
      id         SERIAL PRIMARY KEY,
      content    TEXT        NOT NULL,
      tags       TEXT[]      DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS projects (
      id          SERIAL PRIMARY KEY,
      name        TEXT        NOT NULL,
      description TEXT,
      status      TEXT        DEFAULT 'idea',
      tech_stack  TEXT[]      DEFAULT '{}',
      repo_url    TEXT,
      local_path  TEXT,
      notes       TEXT,
      domain      TEXT,
      git_branch  TEXT,
      git_remote  TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS project_tasks (
      id         SERIAL  PRIMARY KEY,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      content    TEXT    NOT NULL,
      done       BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS setup_items (
      id         TEXT PRIMARY KEY,
      done       BOOLEAN     DEFAULT FALSE,
      notes      TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id         SERIAL PRIMARY KEY,
      provider   TEXT        DEFAULT 'ollama',
      role       TEXT        NOT NULL,
      content    TEXT        NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id           SERIAL       PRIMARY KEY,
      type         TEXT         NOT NULL CHECK (type IN ('income', 'expense')),
      amount       DECIMAL(12,2) NOT NULL,
      description  TEXT,
      category     TEXT,
      date         DATE         NOT NULL DEFAULT CURRENT_DATE,
      source       TEXT,
      created_at   TIMESTAMPTZ  DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS uptime_logs (
      id           SERIAL       PRIMARY KEY,
      target       TEXT         NOT NULL,
      status       INTEGER      NOT NULL,
      response_ms  INTEGER,
      checked_at   TIMESTAMPTZ  DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ssl_certs (
      id           SERIAL       PRIMARY KEY,
      domain       TEXT         NOT NULL UNIQUE,
      issuer       TEXT,
      valid_from   DATE,
      valid_to     DATE,
      status       TEXT         DEFAULT 'unknown',
      error        TEXT,
      last_checked TIMESTAMPTZ,
      created_at   TIMESTAMPTZ  DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settings (
      key          TEXT         PRIMARY KEY,
      value        TEXT,
      updated_at   TIMESTAMPTZ  DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS envelopes (
      id            SERIAL       PRIMARY KEY,
      name          TEXT         NOT NULL,
      type          TEXT         DEFAULT 'generic',
      client_name   TEXT,
      client_email  TEXT,
      company       TEXT,
      domain        TEXT,
      server_ip    TEXT,
      server_url   TEXT,
      whm_username TEXT,
      cpanel_username TEXT,
      registrar    TEXT,
      registrar_account TEXT,
      nameservers  TEXT[],
      ssl_valid_to DATE,
      ssl_issuer   TEXT,
      billing_cycle TEXT,
      monthly_cost  DECIMAL(10,2),
      notes        TEXT,
      custom_fields JSONB DEFAULT '{}',
      created_at   TIMESTAMPTZ  DEFAULT NOW(),
      updated_at   TIMESTAMPTZ  DEFAULT NOW()
    );
  `);

  // Add new columns to existing projects table if they don't exist
  try {
    await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain TEXT`);
    await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS git_branch TEXT`);
    await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS git_remote TEXT`);
    await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS envelope_id INTEGER REFERENCES envelopes(id)`);
  } catch (e) { /* columns may already exist */ }

  console.log('✅ Schema ready');
}
