// GET /api/migrate?secret=<MIGRATE_SECRET>
// Run once after first deploy to create all tables and seed initial data.
// Protect with the MIGRATE_SECRET env variable so only you can run it.

const { sql }           = require('./_db');
const { hashPassword }  = require('./_auth');
const { ok, err, preflight } = require('./_response');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  // Simple secret protection
  const secret = event.queryStringParameters?.secret;
  if (!secret || secret !== process.env.MIGRATE_SECRET) {
    return err('Forbidden — provide ?secret=MIGRATE_SECRET', 403);
  }

  try {
    // ── 1. Create tables ──────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS workers (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        phone      TEXT,
        email      TEXT UNIQUE,
        suk_ids    TEXT[]      DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS members (
        id                   TEXT PRIMARY KEY,
        name                 TEXT NOT NULL,
        phone                TEXT,
        address              TEXT,
        present_address      TEXT,
        geo_location         TEXT,
        member_category      TEXT         NOT NULL DEFAULT 'PROSPECT',
        suk_id               TEXT         NOT NULL,
        assigned_to          TEXT         REFERENCES workers(id),
        family_code          TEXT,
        ishtabhrity_status   TEXT         DEFAULT 'UNKNOWN',
        is_active            BOOLEAN      DEFAULT TRUE,
        removed_reason       TEXT,
        removed_at           TIMESTAMPTZ,
        created_at           TIMESTAMPTZ  DEFAULT NOW(),
        updated_at           TIMESTAMPTZ  DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_members_suk_id      ON members(suk_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_members_assigned_to ON members(assigned_to)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_members_is_active   ON members(is_active)`;

    await sql`
      CREATE TABLE IF NOT EXISTS visits (
        id          TEXT PRIMARY KEY,
        person_id   TEXT REFERENCES members(id),
        visited_by  TEXT REFERENCES workers(id),
        visit_date  DATE         NOT NULL,
        outcome     TEXT,
        notes       TEXT,
        next_action TEXT,
        took_dikhya BOOLEAN      DEFAULT FALSE,
        created_at  TIMESTAMPTZ  DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_visits_person_id ON visits(person_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id            TEXT PRIMARY KEY,
        person_id     TEXT REFERENCES members(id),
        family_code   TEXT,
        recorded_by   TEXT REFERENCES workers(id),
        payment_date  DATE         NOT NULL,
        month_covered TEXT         NOT NULL,
        status        TEXT         NOT NULL DEFAULT 'SENT',
        created_at    TIMESTAMPTZ  DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_person_id ON payments(person_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS drives (
        id          TEXT PRIMARY KEY,
        suk_id      TEXT         NOT NULL,
        title       TEXT         NOT NULL,
        date        DATE         NOT NULL,
        status      TEXT         DEFAULT 'UPCOMING',
        member_ids  TEXT[]       DEFAULT '{}',
        worker_ids  TEXT[]       DEFAULT '{}',
        retrospect  JSONB        DEFAULT '{}',
        notes       TEXT,
        created_at  TIMESTAMPTZ  DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_drives_suk_id ON drives(suk_id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        email         TEXT UNIQUE  NOT NULL,
        name          TEXT         NOT NULL,
        role          TEXT         NOT NULL DEFAULT 'SATSANGEE',
        password_hash TEXT         NOT NULL,
        worker_id     TEXT         REFERENCES workers(id),
        created_at    TIMESTAMPTZ  DEFAULT NOW()
      )
    `;

    // ── 2. Seed workers ───────────────────────────────────────────────────────
    const workers = [
      { id: 'w1', name: 'Sujit Kumar',       email: 'admin@dp.app',      sukIds: ['bngg', 'ejipura', 'garebhabipalya'] },
      { id: 'w2', name: 'Pritosh Pattanaik', email: 'pritosh@dp.app',    sukIds: ['bngg'] },
      { id: 'w3', name: 'Debajyoti Sahoo',   email: 'debajyoti@dp.app',  sukIds: ['bngg'] },
      { id: 'w4', name: 'Ashok Das',         email: 'ashok@dp.app',      sukIds: ['ejipura'] },
      { id: 'w5', name: 'Ramesh Nayak',      email: 'ramesh@dp.app',     sukIds: ['garebhabipalya'] },
      { id: 'w6', name: 'Priya Sharma',      email: 'priya@dp.app',      sukIds: ['bngg'] },
    ];

    for (const w of workers) {
      await sql`
        INSERT INTO workers (id, name, email, suk_ids)
        VALUES (${w.id}, ${w.name}, ${w.email}, ${w.sukIds})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // ── 3. Seed users (hashed passwords) ─────────────────────────────────────
    const users = [
      { id: 'u1', email: 'admin@dp.app',     name: 'Sujit Kumar',       role: 'ADMIN',     password: 'admin123',     workerId: 'w1' },
      { id: 'u2', email: 'pritosh@dp.app',   name: 'Pritosh Pattanaik', role: 'SATSANGEE', password: 'satsangee123', workerId: 'w2' },
      { id: 'u3', email: 'debajyoti@dp.app', name: 'Debajyoti Sahoo',   role: 'SATSANGEE', password: 'satsangee123', workerId: 'w3' },
      { id: 'u4', email: 'ashok@dp.app',     name: 'Ashok Das',         role: 'SATSANGEE', password: 'satsangee123', workerId: 'w4' },
      { id: 'u5', email: 'ramesh@dp.app',    name: 'Ramesh Nayak',      role: 'SATSANGEE', password: 'satsangee123', workerId: 'w5' },
      { id: 'u6', email: 'priya@dp.app',     name: 'Priya Sharma',      role: 'SATSANGEE', password: 'satsangee123', workerId: 'w6' },
    ];

    for (const u of users) {
      const hash = hashPassword(u.password);
      await sql`
        INSERT INTO users (id, email, name, role, password_hash, worker_id)
        VALUES (${u.id}, ${u.email}, ${u.name}, ${u.role}, ${hash}, ${u.workerId})
        ON CONFLICT (email) DO NOTHING
      `;
    }

    return ok({
      message: 'Migration complete ✅',
      tables:  ['workers', 'members', 'visits', 'payments', 'drives', 'users'],
      seeded:  { workers: workers.length, users: users.length },
    });

  } catch (e) {
    console.error('migrate error', e);
    return err(`Migration failed: ${e.message}`, 500);
  }
};
