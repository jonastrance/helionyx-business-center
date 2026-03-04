-- Helionyx Business Center — PostgreSQL Schema
-- Run: psql -U postgres -c "CREATE DATABASE helionyx;" && psql -U postgres -d helionyx -f db/schema.sql
-- Or: the server auto-creates tables on first run if DATABASE_URL is set

CREATE TABLE IF NOT EXISTS thoughts (
  id         SERIAL      PRIMARY KEY,
  content    TEXT        NOT NULL,
  tags       TEXT[]      DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL      PRIMARY KEY,
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
  id         SERIAL      PRIMARY KEY,
  project_id INTEGER     REFERENCES projects(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL,
  done       BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS setup_items (
  id         TEXT        PRIMARY KEY,
  done       BOOLEAN     DEFAULT FALSE,
  notes      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         SERIAL      PRIMARY KEY,
  provider   TEXT        DEFAULT 'ollama',
  role       TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finance/Revenue Tracker
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

-- Uptime Monitoring
CREATE TABLE IF NOT EXISTS uptime_logs (
  id           SERIAL       PRIMARY KEY,
  target       TEXT         NOT NULL,
  status       INTEGER      NOT NULL,
  response_ms  INTEGER,
  checked_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- SSL Certificate Tracking
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

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key          TEXT         PRIMARY KEY,
  value        TEXT,
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- Envelopes (reusable project metadata)
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

-- Link projects to envelopes
ALTER TABLE projects ADD COLUMN IF NOT EXISTS envelope_id INTEGER REFERENCES envelopes(id);

-- Prompts (saved prompts library)
CREATE TABLE IF NOT EXISTS prompts (
  id           SERIAL       PRIMARY KEY,
  title        TEXT         NOT NULL,
  content      TEXT         NOT NULL,
  category     TEXT         DEFAULT 'general',
  tags         TEXT[]       DEFAULT '{}',
  use_count    INTEGER      DEFAULT 0,
  last_used    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_thoughts_created   ON thoughts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_updated   ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_envelopes_name    ON envelopes(name);
CREATE INDEX IF NOT EXISTS idx_envelopes_type    ON envelopes(type);
CREATE INDEX IF NOT EXISTS idx_prompts_category  ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_updated  ON prompts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_created       ON chat_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_tasks_project      ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date  ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_uptime_checked     ON uptime_logs(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_ssl_domain         ON ssl_certs(domain);
