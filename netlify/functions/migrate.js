// GET /api/migrate?secret=<MIGRATE_SECRET>
// Safe to re-run — all inserts use ON CONFLICT DO NOTHING.
// Run once after first deploy, or again after any code update.

const { sql }           = require('./_db');
const { hashPassword }  = require('./_auth');
const { ok, err, preflight } = require('./_response');

// Relative date helper — same as mockData.js daysAgo()
function daysAgo(n) {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().split('T')[0];
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  const secret = event.queryStringParameters?.secret;
  if (!secret || secret !== process.env.MIGRATE_SECRET) {
    return err('Forbidden — provide ?secret=MIGRATE_SECRET', 403);
  }

  const schemaOnly = event.queryStringParameters?.schemaOnly === 'true';

  try {
    // ── 1. Create tables (idempotent) ─────────────────────────────────────────
    await sql`CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, email TEXT UNIQUE,
      suk_ids TEXT[] DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, contact_no TEXT, address TEXT,
      present_address TEXT, permanent_address TEXT, geo_location TEXT,
      member_category TEXT NOT NULL DEFAULT 'PROSPECT',
      suk_id TEXT NOT NULL, assigned_to TEXT REFERENCES workers(id),
      family_code TEXT, ishtabhrity_status TEXT DEFAULT 'UNKNOWN',
      ishtabhrity_start_date DATE, guardian_name TEXT, ritwik_name TEXT,
      dp_status TEXT DEFAULT 'FW_PENDING', profession TEXT, area TEXT, pin_code TEXT,
      has_asthan BOOLEAN DEFAULT FALSE, is_adikshita BOOLEAN DEFAULT FALSE,
      recently_took_dikhya BOOLEAN DEFAULT FALSE, plays_harmonium BOOLEAN DEFAULT FALSE,
      spouse_prospect BOOLEAN DEFAULT FALSE, children_prospect BOOLEAN DEFAULT FALSE,
      interested_in_singing BOOLEAN DEFAULT FALSE, can_help_in_dp_work BOOLEAN DEFAULT FALSE,
      shares_room BOOLEAN DEFAULT FALSE, stays_in_pg BOOLEAN DEFAULT FALSE,
      keeps_prayer BOOLEAN DEFAULT FALSE, comes_to_satsang BOOLEAN DEFAULT FALSE,
      keeps_bhadra_satsang BOOLEAN DEFAULT FALSE, does_dp_work BOOLEAN DEFAULT FALSE,
      goes_to_temple BOOLEAN DEFAULT FALSE, deoghark_visit BOOLEAN DEFAULT FALSE,
      swastaini BOOLEAN DEFAULT FALSE, new_in_bengaluru BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE, removed_reason TEXT, removed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_members_suk_id      ON members(suk_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_members_assigned_to ON members(assigned_to)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_members_is_active   ON members(is_active)`;

    await sql`CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY, person_id TEXT REFERENCES members(id),
      visited_by TEXT REFERENCES workers(id), visit_date DATE NOT NULL,
      outcome TEXT, notes TEXT, next_action TEXT,
      took_dikhya BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_visits_person_id ON visits(person_id)`;

    await sql`CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, person_id TEXT REFERENCES members(id),
      family_code TEXT, recorded_by TEXT REFERENCES workers(id),
      payment_date DATE NOT NULL, month_covered TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SENT', created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_person_id ON payments(person_id)`;

    await sql`CREATE TABLE IF NOT EXISTS drives (
      id TEXT PRIMARY KEY, suk_id TEXT NOT NULL, title TEXT NOT NULL,
      date DATE NOT NULL, status TEXT DEFAULT 'UPCOMING',
      member_ids TEXT[] DEFAULT '{}', worker_ids TEXT[] DEFAULT '{}',
      retrospect JSONB DEFAULT '{}', notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_drives_suk_id ON drives(suk_id)`;

    await sql`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'dp_worker', password_hash TEXT NOT NULL,
      worker_id TEXT REFERENCES workers(id),
      suk_id TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

    // ── Add new columns to existing tables (idempotent for re-runs) ───────────
    await sql`ALTER TABLE drives ADD COLUMN IF NOT EXISTS time             TEXT`;
    await sql`ALTER TABLE drives ADD COLUMN IF NOT EXISTS drive_type       TEXT`;
    await sql`ALTER TABLE drives ADD COLUMN IF NOT EXISTS meeting_place    TEXT`;
    await sql`ALTER TABLE drives ADD COLUMN IF NOT EXISTS meeting_location TEXT`;
    await sql`ALTER TABLE drives ADD COLUMN IF NOT EXISTS target_area      TEXT`;

    await sql`ALTER TABLE workers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`;
    await sql`ALTER TABLE workers ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'dp_worker'`;
    await sql`ALTER TABLE users   ADD COLUMN IF NOT EXISTS suk_id TEXT`;
    await sql`ALTER TABLE users   ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`;

    // ── Audit log table ───────────────────────────────────────────────────────
    await sql`CREATE TABLE IF NOT EXISTS member_audit_log (
      id          TEXT PRIMARY KEY,
      member_id   TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      changed_by  TEXT REFERENCES workers(id),
      event       TEXT NOT NULL,
      field       TEXT,
      old_value   TEXT,
      new_value   TEXT,
      changed_at  TIMESTAMPTZ DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_member_id ON member_audit_log(member_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON member_audit_log(changed_at DESC)`;

    // ── created_by column on members ──────────────────────────────────────────
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES workers(id)`;

    // ── New member fields ─────────────────────────────────────────────────────
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS initiation_date DATE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS alternate_phone TEXT`;

    // ── Magazine subscription tables ──────────────────────────────────────────
    await sql`CREATE TABLE IF NOT EXISTS suk_magazines (
      id          TEXT PRIMARY KEY,
      suk_id      TEXT NOT NULL,
      name        TEXT NOT NULL,
      language    TEXT,
      is_active   BOOLEAN DEFAULT TRUE,
      sort_order  INT DEFAULT 0,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_suk_magazines_suk ON suk_magazines(suk_id)`;

    await sql`CREATE TABLE IF NOT EXISTS magazine_subscriptions (
      id               TEXT PRIMARY KEY,
      suk_id           TEXT NOT NULL,
      cycle_year       TEXT NOT NULL,
      member_id        TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      magazines        TEXT[] DEFAULT '{}',
      subscribed       BOOLEAN DEFAULT FALSE,
      paid             BOOLEAN DEFAULT FALSE,
      monthly_received JSONB DEFAULT '{}',
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(suk_id, cycle_year, member_id)
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_mag_sub_suk_year ON magazine_subscriptions(suk_id, cycle_year)`;

    // Seed default magazines for each SUK (idempotent)
    const defaultMags = [
      { id:'mag_urj',  name:'Urjana',      language:'Odia',    order: 1 },
      { id:'mag_alo',  name:'Alochana',    language:'Bangla',  order: 2 },
      { id:'mag_sat',  name:'Satwati',     language:'Hindi',   order: 3 },
      { id:'mag_lig',  name:'Ligate',      language:'English', order: 4 },
      { id:'mag_swa',  name:'Swastisebak', language:'Bangla',  order: 5 },
    ];
    const sukIds = ['bngg','bnas','ejip','garb'];
    for (const suk of sukIds) {
      for (const mag of defaultMags) {
        const magId = `${mag.id}_${suk}`;
        await sql`
          INSERT INTO suk_magazines (id, suk_id, name, language, is_active, sort_order)
          VALUES (${magId}, ${suk}, ${mag.name}, ${mag.language}, true, ${mag.order})
          ON CONFLICT (id) DO NOTHING
        `;
      }
    }

    // ── Add new columns to members (idempotent) ───────────────────────────────
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS contact_no TEXT`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS permanent_address TEXT`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS guardian_name TEXT`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS ritwik_name TEXT`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS dp_status TEXT DEFAULT 'FW_PENDING'`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS ishtabhrity_start_date DATE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS profession TEXT`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS area TEXT`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS pin_code TEXT`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS has_asthan BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS is_adikshita BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS recently_took_dikhya BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS plays_harmonium BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS spouse_prospect BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS children_prospect BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS interested_in_singing BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS can_help_in_dp_work BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS shares_room BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS stays_in_pg BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS keeps_prayer BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS comes_to_satsang BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS keeps_bhadra_satsang BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS does_dp_work BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS goes_to_temple BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS deoghark_visit BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS swastaini BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS new_in_bengaluru BOOLEAN DEFAULT FALSE`;
    // Copy legacy phone → contact_no for rows that pre-date this migration
    await sql`UPDATE members SET contact_no = phone WHERE contact_no IS NULL AND phone IS NOT NULL`;

    if (schemaOnly) {
      return ok({ message: 'Schema migration complete ✅ (schemaOnly — seed skipped)' });
    }

    // ── 2. Upsert workers (fixes suk_ids on re-run) ───────────────────────────
    const workers = [
      { id: 'w1', name: 'Sujit Kumar',       email: 'admin@dp.app',     sukIds: ['bngg','bnas','ejip','garb'], role: 'super_admin' },
      { id: 'w2', name: 'Pritosh Pattanaik', email: 'pritosh@dp.app',   sukIds: ['bngg'],                     role: 'dp_worker'   },
      { id: 'w3', name: 'Debajyoti Sahoo',   email: 'debajyoti@dp.app', sukIds: ['bngg'],                     role: 'dp_worker'   },
      { id: 'w4', name: 'Ashok Das',         email: 'ashok@dp.app',     sukIds: ['bngg'],                     role: 'dp_worker'   },
      { id: 'w5', name: 'Ramesh Nayak',      email: 'ramesh@dp.app',    sukIds: ['bnas'],                     role: 'dp_worker'   },
      { id: 'w6', name: 'Priya Sharma',      email: 'priya@dp.app',     sukIds: ['bnas'],                     role: 'dp_worker'   },
    ];
    for (const w of workers) {
      await sql`
        INSERT INTO workers (id, name, email, suk_ids, role, is_active)
        VALUES (${w.id}, ${w.name}, ${w.email}, ${w.sukIds}, ${w.role}, true)
        ON CONFLICT (id) DO UPDATE SET
          name      = EXCLUDED.name,
          suk_ids   = EXCLUDED.suk_ids,
          role      = EXCLUDED.role,
          is_active = COALESCE(workers.is_active, true)
      `;
    }

    // ── 3. Upsert users ───────────────────────────────────────────────────────
    const users = [
      { id: 'u1', email: 'admin@dp.app',     name: 'Sujit Kumar',       role: 'super_admin', password: 'admin123',     workerId: 'w1', sukId: null },
      { id: 'u2', email: 'pritosh@dp.app',   name: 'Pritosh Pattanaik', role: 'dp_worker',   password: 'satsangee123', workerId: 'w2', sukId: null },
      { id: 'u3', email: 'debajyoti@dp.app', name: 'Debajyoti Sahoo',   role: 'dp_worker',   password: 'satsangee123', workerId: 'w3', sukId: null },
      { id: 'u4', email: 'ashok@dp.app',     name: 'Ashok Das',         role: 'dp_worker',   password: 'satsangee123', workerId: 'w4', sukId: null },
      { id: 'u5', email: 'ramesh@dp.app',    name: 'Ramesh Nayak',      role: 'dp_worker',   password: 'satsangee123', workerId: 'w5', sukId: null },
      { id: 'u6', email: 'priya@dp.app',     name: 'Priya Sharma',      role: 'dp_worker',   password: 'satsangee123', workerId: 'w6', sukId: null },
    ];
    for (const u of users) {
      const hash = hashPassword(u.password);
      await sql`
        INSERT INTO users (id, email, name, role, password_hash, worker_id, suk_id, is_active)
        VALUES (${u.id}, ${u.email}, ${u.name}, ${u.role}, ${hash}, ${u.workerId}, ${u.sukId}, true)
        ON CONFLICT (email) DO UPDATE SET
          role      = EXCLUDED.role,
          suk_id    = EXCLUDED.suk_id,
          is_active = COALESCE(users.is_active, true)
      `;
    }

    // ── 4. Seed members ───────────────────────────────────────────────────────
    const members = [
      { id:'m1',  familyCode:'022321461826', name:'Akshay Palei',                sukId:'bngg', assignedTo:'w4', memberCategory:'REGULAR_CONTRIBUTOR', ishtabhritiStatus:'REGULAR',       phone:'7436808109', address:'Odisha',       presentAddress:'Flat 12, Akshay Nagar, Bannerghatta Rd',           geoLocation:'https://maps.google.com/?q=12.8908,77.5975' },
      { id:'m2',  familyCode:'022321541977', name:'Ananda Barik',                sukId:'bngg', assignedTo:'w4', memberCategory:'ACTIVE_DP_WORKER',    ishtabhritiStatus:'REGULAR',       phone:'7978770054', address:'Odisha',       presentAddress:'Flat 7B, Sunrise Apts, Akshay Nagar',             geoLocation:'https://maps.google.com/?q=12.8910,77.5980' },
      { id:'m3',  familyCode:'501297819100', name:'Mrinal Mohanty',              sukId:'bngg', assignedTo:'w2', memberCategory:'DEFAULTER',           ishtabhritiStatus:'INACTIVE',      phone:'9886123456', address:'Odisha',       presentAddress:'Near RTO KA 51, Vijaya Bank Layout, 80ft Road',   geoLocation:'https://maps.google.com/?q=12.8655,77.6083' },
      { id:'m4',  familyCode:'345114820000', name:'Ananda Sekhar Bhattacherjee', sukId:'bngg', assignedTo:'w2', memberCategory:'DEFAULTER',           ishtabhritiStatus:'INACTIVE',      phone:'9844567890', address:'West Bengal',  presentAddress:'Pride Regalia, Flat 1107, 80/3, Hulimavu Gate',   geoLocation:'https://maps.google.com/?q=12.8645,77.6077' },
      { id:'m5',  familyCode:'022321771120', name:'Priya Das',                   sukId:'bngg', assignedTo:'w3', memberCategory:'SUPER_NEW',           ishtabhritiStatus:'NEW',           phone:'9731456780', address:'Bangalore',    presentAddress:'14th Cross, HSR Layout Sector 3',                 geoLocation:'' },
      { id:'m6',  familyCode:'022321880930', name:'Rajesh Kumar',                sukId:'bngg', assignedTo:'w3', memberCategory:'SEMI_ACTIVE',         ishtabhritiStatus:'IRREGULAR',     phone:'8867345612', address:'Karnataka',    presentAddress:'Prestige Shantiniketan, Electronic City Phase 2', geoLocation:'' },
      { id:'m7',  familyCode:'',             name:'Suresh Patel',                sukId:'bngg', assignedTo:'w4', memberCategory:'PROSPECT',            ishtabhritiStatus:'NOT_APPLICABLE',phone:'9945671230', address:'Tamil Nadu',   presentAddress:'3rd Block, GB Pallya, Bannerghatta Road',         geoLocation:'https://maps.google.com/?q=12.8850,77.5990' },
      { id:'m8',  familyCode:'022321552100', name:'Sita Devi',                   sukId:'bngg', assignedTo:'w2', memberCategory:'REGULAR_CONTRIBUTOR', ishtabhritiStatus:'REGULAR',       phone:'9740123456', address:'Odisha',       presentAddress:'Sai Niwas, 2nd Floor, Bannerghatta Road',         geoLocation:'' },
      { id:'m9',  familyCode:'022321998870', name:'Amit Sharma',                 sukId:'bngg', assignedTo:'w3', memberCategory:'SUPER_NEW',           ishtabhritiStatus:'NEW',           phone:'8310234567', address:'Rajasthan',    presentAddress:'Nandini Layout, Hulimavu',                        geoLocation:'' },
      { id:'m10', familyCode:'022321334210', name:'Kavita Nair',                 sukId:'bngg', assignedTo:'w2', memberCategory:'SEMI_ACTIVE',         ishtabhritiStatus:'IRREGULAR',     phone:'9632012345', address:'Kerala',       presentAddress:'Prestige Lake Ridge, JP Nagar Phase 6',           geoLocation:'https://maps.google.com/?q=12.9005,77.5850' },
      { id:'m11', familyCode:'',             name:'Deepak Verma',                sukId:'bngg', assignedTo:'w4', memberCategory:'PROSPECT',            ishtabhritiStatus:'NOT_APPLICABLE',phone:'9741567890', address:'Uttar Pradesh',presentAddress:'Infosys Road, Electronic City Phase 1',           geoLocation:'' },
      { id:'m12', familyCode:'022321293091', name:'Anadi Behera',                sukId:'bnas', assignedTo:'w5', memberCategory:'REGULAR_CONTRIBUTOR', ishtabhritiStatus:'REGULAR',       phone:'8618350099', address:'Odisha',       presentAddress:'Kanakapura Road, near BTM Layout',                geoLocation:'https://maps.google.com/?q=12.9101,77.5872' },
      { id:'m13', familyCode:'500795817000', name:'Sumit Sharma',                sukId:'bnas', assignedTo:'w5', memberCategory:'SEMI_ACTIVE',         ishtabhritiStatus:'IRREGULAR',     phone:'8660046460', address:'Bangalore',    presentAddress:'Banashankari 3rd Stage',                          geoLocation:'' },
      { id:'m14', familyCode:'0053537092',   name:'Jayakishore Pandit',          sukId:'bnas', assignedTo:'w6', memberCategory:'ACTIVE_DP_WORKER',    ishtabhritiStatus:'REGULAR',       phone:'8951209767', address:'Odisha',       presentAddress:'Siddapa Layout, Banashankari',                    geoLocation:'https://maps.google.com/?q=12.9230,77.5710' },
      { id:'m15', familyCode:'49218794',     name:'Hemant Sahoo',                sukId:'bnas', assignedTo:'w5', memberCategory:'REGULAR_CONTRIBUTOR', ishtabhritiStatus:'REGULAR',       phone:'8050147411', address:'Odisha',       presentAddress:'Siddapa Layout, near Banashankari Temple',        geoLocation:'' },
      { id:'m16', familyCode:'022321445610', name:'Nalini Patra',                sukId:'bnas', assignedTo:'w6', memberCategory:'SEMI_ACTIVE',         ishtabhritiStatus:'IRREGULAR',     phone:'9980123456', address:'Odisha',       presentAddress:'JP Nagar Phase 7, Bangalore',                     geoLocation:'' },
      { id:'m17', familyCode:'',             name:'Gautam Das',                  sukId:'bnas', assignedTo:'w5', memberCategory:'PROSPECT',            ishtabhritiStatus:'NOT_APPLICABLE',phone:'9741890123', address:'West Bengal',  presentAddress:'Banashankari 2nd Stage, near Bus Stand',          geoLocation:'' },
      { id:'m18', familyCode:'022321667780', name:'Binita Roy',                  sukId:'bnas', assignedTo:'w6', memberCategory:'DEFAULTER',           ishtabhritiStatus:'INACTIVE',      phone:'9845678901', address:'West Bengal',  presentAddress:'Kanakapura Road, Uttarahalli',                    geoLocation:'https://maps.google.com/?q=12.8950,77.5700' },
      { id:'m19', familyCode:'022321228840', name:'Rajkumar Nair',               sukId:'bnas', assignedTo:'w5', memberCategory:'ACTIVE_DP_WORKER',    ishtabhritiStatus:'REGULAR',       phone:'9886012345', address:'Kerala',       presentAddress:'Banashankari 1st Stage, Bangalore',               geoLocation:'' },
      { id:'m20', familyCode:'022321119920', name:'Sunita Mishra',               sukId:'bngg', assignedTo:'w3', memberCategory:'SUPER_NEW',           ishtabhritiStatus:'NEW',           phone:'9741234560', address:'Madhya Pradesh',presentAddress:'Hulimavu Main Road, Bangalore',                  geoLocation:'' },
    ];
    for (const m of members) {
      await sql`
        INSERT INTO members (id, name, contact_no, address, present_address, geo_location,
          member_category, suk_id, assigned_to, family_code, ishtabhrity_status)
        VALUES (${m.id}, ${m.name}, ${m.phone}, ${m.address}, ${m.presentAddress},
          ${m.geoLocation || null}, ${m.memberCategory}, ${m.sukId}, ${m.assignedTo},
          ${m.familyCode || null}, ${m.ishtabhritiStatus})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // ── 5. Seed visits ────────────────────────────────────────────────────────
    const visits = [
      { id:'v1',  personId:'m3',  visitedBy:'w2', date:daysAgo(7),  outcome:'Listened but non-committal', notes:'Met at home. Explained importance of Ishtabhrity. He said he will think about it.',                             nextAction:'Visit again in 2 weeks' },
      { id:'v2',  personId:'m3',  visitedBy:'w2', date:daysAgo(21), outcome:'Not at home',                notes:'Door not opened. Neighbour said he is at home.',                                                              nextAction:'Try on weekend morning' },
      { id:'v3',  personId:'m4',  visitedBy:'w2', date:daysAgo(5),  outcome:'Responsive & willing',       notes:'Met wife. Husband was not available. She is willing to restart but husband needs to be convinced.',            nextAction:'Meet husband directly next time' },
      { id:'v4',  personId:'m4',  visitedBy:'w3', date:daysAgo(35), outcome:'Listened but non-committal', notes:'Both were home. Had a long conversation. He said he stopped due to work pressure. We showed him the path.',   nextAction:'Follow up in 10 days' },
      { id:'v5',  personId:'m7',  visitedBy:'w4', date:daysAgo(3),  outcome:'Responsive & willing',       notes:'Very warm reception. Entire family attended. They are very interested in Dikhya.',                           nextAction:'Invite to next Satsang' },
      { id:'v6',  personId:'m7',  visitedBy:'w4', date:daysAgo(18), outcome:'Responsive & willing',       notes:'First visit. Met Suresh. He asked many questions about the practice.',                                       nextAction:'Visit again with more information' },
      { id:'v7',  personId:'m11', visitedBy:'w4', date:daysAgo(10), outcome:'Listened but non-committal', notes:'Deepak is interested. His wife is more hesitant. Need to build more trust.',                                 nextAction:'Engage wife too' },
      { id:'v8',  personId:'m17', visitedBy:'w5', date:daysAgo(14), outcome:'Responsive & willing',       notes:'Gautam was very welcoming. He already knew about the mission through a colleague.',                          nextAction:'Share more about Dikhya process' },
      { id:'v9',  personId:'m18', visitedBy:'w6', date:daysAgo(8),  outcome:'Not at home',                notes:'Binita not at home. Neighbour said she moved offices, should be home weekends.',                             nextAction:'Visit on Saturday morning' },
      { id:'v10', personId:'m18', visitedBy:'w6', date:daysAgo(30), outcome:'Listened but non-committal', notes:'Met Binita. She was upset about some past experience. Listened patiently and gave her comfort.',             nextAction:'Give her space and visit next month' },
      { id:'v11', personId:'m6',  visitedBy:'w3', date:daysAgo(12), outcome:'Listened but non-committal', notes:'Rajesh has been irregular since last 4 months. He says work schedule is hectic. Encouraged him.',           nextAction:'Help him with online Ishtabhrity option' },
      { id:'v12', personId:'m10', visitedBy:'w2', date:daysAgo(20), outcome:'Responsive & willing',       notes:'Kavita attended Satsang last week. Following up. She wants to be more regular.',                            nextAction:'Include in next DP work team' },
    ];
    for (const v of visits) {
      await sql`
        INSERT INTO visits (id, person_id, visited_by, visit_date, outcome, notes, next_action)
        VALUES (${v.id}, ${v.personId}, ${v.visitedBy}, ${v.date}, ${v.outcome}, ${v.notes}, ${v.nextAction})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // ── 6. Seed payments ──────────────────────────────────────────────────────
    const payments = [
      { id:'p1a',  personId:'m1',  fam:'022321461826', by:'w4', date:daysAgo(120), month:'2026-01' },
      { id:'p1b',  personId:'m1',  fam:'022321461826', by:'w4', date:daysAgo(90),  month:'2026-02' },
      { id:'p1c',  personId:'m1',  fam:'022321461826', by:'w4', date:daysAgo(60),  month:'2026-03' },
      { id:'p1d',  personId:'m1',  fam:'022321461826', by:'w4', date:daysAgo(30),  month:'2026-04' },
      { id:'p2a',  personId:'m2',  fam:'022321541977', by:'w3', date:daysAgo(119), month:'2026-01' },
      { id:'p2b',  personId:'m2',  fam:'022321541977', by:'w3', date:daysAgo(89),  month:'2026-02' },
      { id:'p2c',  personId:'m2',  fam:'022321541977', by:'w3', date:daysAgo(59),  month:'2026-03' },
      { id:'p2d',  personId:'m2',  fam:'022321541977', by:'w3', date:daysAgo(29),  month:'2026-04' },
      { id:'p6a',  personId:'m6',  fam:'022321880930', by:'w3', date:daysAgo(110), month:'2026-01' },
      { id:'p6b',  personId:'m6',  fam:'022321880930', by:'w3', date:daysAgo(80),  month:'2026-02' },
      { id:'p6c',  personId:'m6',  fam:'022321880930', by:'w3', date:daysAgo(50),  month:'2026-03' },
      { id:'p8a',  personId:'m8',  fam:'022321552100', by:'w2', date:daysAgo(119), month:'2026-01' },
      { id:'p8b',  personId:'m8',  fam:'022321552100', by:'w2', date:daysAgo(89),  month:'2026-02' },
      { id:'p8c',  personId:'m8',  fam:'022321552100', by:'w2', date:daysAgo(59),  month:'2026-03' },
      { id:'p8d',  personId:'m8',  fam:'022321552100', by:'w2', date:daysAgo(29),  month:'2026-04' },
      { id:'p10a', personId:'m10', fam:'022321334210', by:'w2', date:daysAgo(160), month:'2025-12' },
      { id:'p10b', personId:'m10', fam:'022321334210', by:'w2', date:daysAgo(130), month:'2026-01' },
      { id:'p10c', personId:'m10', fam:'022321334210', by:'w2', date:daysAgo(100), month:'2026-02' },
      { id:'p12a', personId:'m12', fam:'022321293091', by:'w5', date:daysAgo(120), month:'2026-01' },
      { id:'p12b', personId:'m12', fam:'022321293091', by:'w5', date:daysAgo(90),  month:'2026-02' },
      { id:'p12c', personId:'m12', fam:'022321293091', by:'w5', date:daysAgo(60),  month:'2026-03' },
      { id:'p12d', personId:'m12', fam:'022321293091', by:'w5', date:daysAgo(30),  month:'2026-04' },
      { id:'p13a', personId:'m13', fam:'500795817000', by:'w5', date:daysAgo(100), month:'2026-02' },
      { id:'p13b', personId:'m13', fam:'500795817000', by:'w5', date:daysAgo(70),  month:'2026-03' },
      { id:'p14a', personId:'m14', fam:'0053537092',   by:'w6', date:daysAgo(135), month:'2025-12' },
      { id:'p14b', personId:'m14', fam:'0053537092',   by:'w6', date:daysAgo(105), month:'2026-01' },
      { id:'p14c', personId:'m14', fam:'0053537092',   by:'w6', date:daysAgo(75),  month:'2026-02' },
      { id:'p14d', personId:'m14', fam:'0053537092',   by:'w6', date:daysAgo(45),  month:'2026-03' },
      { id:'p15a', personId:'m15', fam:'49218794',     by:'w5', date:daysAgo(95),  month:'2026-02' },
      { id:'p15b', personId:'m15', fam:'49218794',     by:'w5', date:daysAgo(65),  month:'2026-03' },
      { id:'p15c', personId:'m15', fam:'49218794',     by:'w5', date:daysAgo(35),  month:'2026-04' },
      { id:'p15d', personId:'m15', fam:'49218794',     by:'w5', date:daysAgo(5),   month:'2026-05' },
      { id:'p16a', personId:'m16', fam:'022321445610', by:'w6', date:daysAgo(155), month:'2025-12' },
      { id:'p16b', personId:'m16', fam:'022321445610', by:'w6', date:daysAgo(125), month:'2026-01' },
      { id:'p16c', personId:'m16', fam:'022321445610', by:'w6', date:daysAgo(95),  month:'2026-02' },
      { id:'p19a', personId:'m19', fam:'022321228840', by:'w5', date:daysAgo(100), month:'2026-02' },
      { id:'p19b', personId:'m19', fam:'022321228840', by:'w5', date:daysAgo(70),  month:'2026-03' },
      { id:'p19c', personId:'m19', fam:'022321228840', by:'w5', date:daysAgo(40),  month:'2026-04' },
      { id:'p19d', personId:'m19', fam:'022321228840', by:'w5', date:daysAgo(10),  month:'2026-05' },
    ];
    for (const p of payments) {
      await sql`
        INSERT INTO payments (id, person_id, family_code, recorded_by, payment_date, month_covered, status)
        VALUES (${p.id}, ${p.personId}, ${p.fam}, ${p.by}, ${p.date}, ${p.month}, 'SENT')
        ON CONFLICT (id) DO NOTHING
      `;
    }

    return ok({
      message: 'Migration complete ✅',
      tables:  ['workers','members','visits','payments','drives','users'],
      seeded:  {
        workers:  workers.length,
        users:    users.length,
        members: members.length,
        visits:   visits.length,
        payments: payments.length,
      },
    });
  } catch (e) {
    console.error('migrate error', e);
    return err(e.message || 'Migration failed', 500);
  }
};
