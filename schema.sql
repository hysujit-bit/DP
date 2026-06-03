-- DP Work App — PostgreSQL Schema
-- Run this once via the migrate endpoint or directly in Neon's SQL editor.
-- All tables use TEXT primary keys (matching the existing app IDs).

-- ─── Workers ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workers (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT UNIQUE,
  suk_ids     TEXT[]    DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Members (Satsangees) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  phone                TEXT,
  address              TEXT,
  present_address      TEXT,
  geo_location         TEXT,
  member_category      TEXT NOT NULL DEFAULT 'PROSPECT',
  suk_id               TEXT NOT NULL,
  assigned_to          TEXT REFERENCES workers(id),
  family_code          TEXT,
  ishtabhrity_status   TEXT DEFAULT 'UNKNOWN',
  is_active            BOOLEAN DEFAULT TRUE,
  removed_reason       TEXT,
  removed_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_suk_id      ON members(suk_id);
CREATE INDEX IF NOT EXISTS idx_members_assigned_to ON members(assigned_to);
CREATE INDEX IF NOT EXISTS idx_members_is_active   ON members(is_active);

-- ─── Visits ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id          TEXT PRIMARY KEY,
  person_id   TEXT REFERENCES members(id),
  visited_by  TEXT REFERENCES workers(id),
  visit_date  DATE NOT NULL,
  outcome     TEXT,
  notes       TEXT,
  next_action TEXT,
  took_dikhya BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_person_id ON visits(person_id);

-- ─── Payments (Ishtabhrity) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id             TEXT PRIMARY KEY,
  person_id      TEXT REFERENCES members(id),
  family_code    TEXT,
  recorded_by    TEXT REFERENCES workers(id),
  payment_date   DATE NOT NULL,
  month_covered  TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'SENT',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_person_id ON payments(person_id);

-- ─── Drives (Work campaigns) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drives (
  id               TEXT PRIMARY KEY,
  suk_id           TEXT NOT NULL,
  title            TEXT NOT NULL,
  date             DATE NOT NULL,
  time             TEXT,
  drive_type       TEXT,
  meeting_place    TEXT,
  meeting_location TEXT,
  target_area      TEXT,
  status           TEXT DEFAULT 'UPCOMING',
  member_ids       TEXT[]  DEFAULT '{}',
  worker_ids       TEXT[]  DEFAULT '{}',
  retrospect       JSONB   DEFAULT '{}',
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: add new columns if they don't exist yet (safe to re-run)
ALTER TABLE drives ADD COLUMN IF NOT EXISTS time             TEXT;
ALTER TABLE drives ADD COLUMN IF NOT EXISTS drive_type       TEXT;
ALTER TABLE drives ADD COLUMN IF NOT EXISTS meeting_place    TEXT;
ALTER TABLE drives ADD COLUMN IF NOT EXISTS meeting_location TEXT;
ALTER TABLE drives ADD COLUMN IF NOT EXISTS target_area      TEXT;

CREATE INDEX IF NOT EXISTS idx_drives_suk_id ON drives(suk_id);
CREATE INDEX IF NOT EXISTS idx_drives_status ON drives(status);

-- ─── Users (Authentication) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'SATSANGEE',
  password_hash TEXT NOT NULL,
  worker_id     TEXT REFERENCES workers(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
