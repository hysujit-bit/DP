// Magazine subscriptions API
//
// GET  /api/magazines?sukId=bngg&year=2026-2027        — list subscriptions for a SUK + year
// GET  /api/magazines?sukId=bngg&type=config           — list magazines config for a SUK
// POST /api/magazines                                  — create/upsert subscription row
// POST /api/magazines?type=config                      — add a new magazine to SUK config
// PATCH /api/magazines?id=xxx                          — update subscription (checkboxes etc)
// PATCH /api/magazines?configId=xxx                    — update magazine config
// DELETE /api/magazines?id=xxx                         — remove subscription row
// DELETE /api/magazines?configId=xxx                   — remove magazine from config

const { sql }         = require('./_db');
const { requireAuth } = require('./_auth');
const { ok, err, preflight, body } = require('./_response');

function currentCycleYear() {
  const now = new Date();
  const month = now.getMonth(); // 0=Jan
  const year  = now.getFullYear();
  // Cycle: Jun(5) → May(4 next year)
  if (month >= 5) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  let caller;
  try { caller = requireAuth(event); }
  catch { return err('Unauthorised', 401); }

  const q = event.queryStringParameters || {};

  try {
    // ── GET ──────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      if (!q.sukId) return err('sukId is required');

      // Return magazine config list
      if (q.type === 'config') {
        const rows = await sql`
          SELECT * FROM suk_magazines WHERE suk_id = ${q.sukId} AND is_active = TRUE
          ORDER BY sort_order, name
        `;
        return ok(rows.map(r => ({ id: r.id, sukId: r.suk_id, name: r.name, language: r.language, sortOrder: r.sort_order })));
      }

      // Return subscriptions for a year
      const year = q.year || currentCycleYear();
      const rows = await sql`
        SELECT s.*, m.name AS member_name, m.contact_no, m.member_category
        FROM magazine_subscriptions s
        JOIN members m ON m.id = s.member_id
        WHERE s.suk_id = ${q.sukId} AND s.cycle_year = ${year}
        ORDER BY m.name
      `;
      return ok({
        year,
        currentYear: currentCycleYear(),
        rows: rows.map(r => ({
          id: r.id, sukId: r.suk_id, cycleYear: r.cycle_year,
          memberId: r.member_id, memberName: r.member_name,
          contactNo: r.contact_no, memberCategory: r.member_category,
          magazines: r.magazines || [],
          subscribed: r.subscribed, paid: r.paid,
          monthlyReceived: r.monthly_received || {},
          createdAt: r.created_at, updatedAt: r.updated_at,
        })),
      });
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const d = body(event);

      // Add magazine to config
      if (q.type === 'config') {
        if (!d.sukId || !d.name) return err('sukId and name required');
        const newId = `mag_${Date.now().toString(36)}_${d.sukId}`;
        await sql`
          INSERT INTO suk_magazines (id, suk_id, name, language, is_active, sort_order)
          VALUES (${newId}, ${d.sukId}, ${d.name}, ${d.language || null}, true,
            COALESCE((SELECT MAX(sort_order)+1 FROM suk_magazines WHERE suk_id = ${d.sukId}), 1))
        `;
        const [row] = await sql`SELECT * FROM suk_magazines WHERE id = ${newId}`;
        return ok({ id: row.id, sukId: row.suk_id, name: row.name, language: row.language, sortOrder: row.sort_order }, 201);
      }

      // Upsert subscription row
      if (!d.sukId || !d.memberId) return err('sukId and memberId required');
      const year = d.cycleYear || currentCycleYear();
      const newId = `msub_${Date.now().toString(36)}`;

      await sql`
        INSERT INTO magazine_subscriptions (id, suk_id, cycle_year, member_id, magazines, subscribed, paid, monthly_received)
        VALUES (${newId}, ${d.sukId}, ${year}, ${d.memberId}, ${d.magazines || []}, ${d.subscribed || false}, ${d.paid || false}, ${JSON.stringify(d.monthlyReceived || {})}::jsonb)
        ON CONFLICT (suk_id, cycle_year, member_id) DO UPDATE SET
          magazines        = EXCLUDED.magazines,
          subscribed       = EXCLUDED.subscribed,
          paid             = EXCLUDED.paid,
          monthly_received = EXCLUDED.monthly_received,
          updated_at       = NOW()
        RETURNING id
      `;

      const [existing] = await sql`
        SELECT s.*, m.name AS member_name, m.contact_no, m.member_category
        FROM magazine_subscriptions s JOIN members m ON m.id = s.member_id
        WHERE s.suk_id = ${d.sukId} AND s.cycle_year = ${year} AND s.member_id = ${d.memberId}
      `;
      return ok({
        id: existing.id, sukId: existing.suk_id, cycleYear: existing.cycle_year,
        memberId: existing.member_id, memberName: existing.member_name,
        magazines: existing.magazines || [], subscribed: existing.subscribed, paid: existing.paid,
        monthlyReceived: existing.monthly_received || {},
      }, 201);
    }

    // ── PATCH ────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'PATCH') {
      const d = body(event);

      // Update magazine config
      if (q.configId) {
        await sql`
          UPDATE suk_magazines SET
            name       = COALESCE(${d.name       ?? null}, name),
            language   = COALESCE(${d.language   ?? null}, language),
            is_active  = COALESCE(${d.isActive   ?? null}, is_active),
            sort_order = COALESCE(${d.sortOrder  ?? null}, sort_order)
          WHERE id = ${q.configId}
        `;
        const [row] = await sql`SELECT * FROM suk_magazines WHERE id = ${q.configId}`;
        return ok({ id: row.id, sukId: row.suk_id, name: row.name, language: row.language, isActive: row.is_active, sortOrder: row.sort_order });
      }

      // Update subscription
      if (!q.id) return err('id required');
      await sql`
        UPDATE magazine_subscriptions SET
          magazines        = COALESCE(${d.magazines        ?? null}, magazines),
          subscribed       = COALESCE(${d.subscribed       ?? null}, subscribed),
          paid             = COALESCE(${d.paid             ?? null}, paid),
          monthly_received = CASE WHEN ${d.monthlyReceived !== undefined} THEN ${JSON.stringify(d.monthlyReceived ?? {})}::jsonb ELSE monthly_received END,
          updated_at       = NOW()
        WHERE id = ${q.id}
      `;
      const [row] = await sql`
        SELECT s.*, m.name AS member_name FROM magazine_subscriptions s
        JOIN members m ON m.id = s.member_id WHERE s.id = ${q.id}
      `;
      return ok({
        id: row.id, memberId: row.member_id, memberName: row.member_name,
        magazines: row.magazines || [], subscribed: row.subscribed, paid: row.paid,
        monthlyReceived: row.monthly_received || {},
      });
    }

    // ── DELETE ───────────────────────────────────────────────────────────────
    if (event.httpMethod === 'DELETE') {
      if (q.configId) {
        await sql`UPDATE suk_magazines SET is_active = FALSE WHERE id = ${q.configId}`;
        return ok({ ok: true });
      }
      if (q.id) {
        await sql`DELETE FROM magazine_subscriptions WHERE id = ${q.id}`;
        return ok({ ok: true });
      }
      return err('id or configId required');
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('magazines error', e);
    return err(e.message || 'Server error', 500);
  }
};
