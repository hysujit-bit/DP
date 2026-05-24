// GET   /api/workers             — list workers (scoped to caller's role)
// POST  /api/workers             — create worker + login account (admin only)
// PATCH /api/workers?id=xxx      — update worker (admin only); deactivate syncs to users table

const { sql }                        = require('./_db');
const { requireAuth, hashPassword }  = require('./_auth');
const { ok, err, preflight, body }   = require('./_response');

function toApp(row) {
  return {
    id:        row.id,
    name:      row.name,
    phone:     row.phone,
    email:     row.email,
    sukIds:    row.suk_ids || [],
    role:      row.role    || 'dp_worker',
    isActive:  row.is_active !== false,   // default true if null
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  let caller;
  try { caller = requireAuth(event); }
  catch { return err('Unauthorised', 401); }

  const isSuperAdmin = caller.role === 'super_admin';
  const isSukAdmin   = caller.role === 'suk_admin';
  const isAnyAdmin   = isSuperAdmin || isSukAdmin;

  const { id } = event.queryStringParameters || {};

  try {
    // ── GET ───────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      let rows;
      if (isSuperAdmin) {
        // Super admin sees all workers
        rows = await sql`SELECT * FROM workers ORDER BY name`;
      } else {
        // SUK admin / DP worker see only workers in their SUK
        const mySukId = caller.sukId || (await getWorkerSukId(caller.workerId));
        rows = await sql`
          SELECT * FROM workers
          WHERE ${mySukId} = ANY(suk_ids)
          ORDER BY name
        `;
      }
      return ok(rows.map(toApp));
    }

    // ── POST — create worker + login account ──────────────────────────────────
    if (event.httpMethod === 'POST') {
      if (!isAnyAdmin) return err('Forbidden', 403);

      const d = body(event);
      if (!d.name || !d.email) return err('name and email are required');
      if (!d.tempPassword || d.tempPassword.length < 6) return err('tempPassword must be at least 6 characters');

      const newId  = `w_${Date.now().toString(36)}`;
      const userId = `u_${Date.now().toString(36)}`;

      // Determine role — SUK admin can only create dp_worker
      const role = isSuperAdmin
        ? (d.role === 'suk_admin' ? 'suk_admin' : 'dp_worker')
        : 'dp_worker';

      // For suk_admin: primary suk is d.primarySukId; for dp_worker: just use sukIds
      const sukIds     = Array.isArray(d.sukIds) ? d.sukIds : (d.sukIds ? [d.sukIds] : []);
      const primarySuk = role === 'suk_admin' ? (d.primarySukId || sukIds[0] || null) : null;

      // SUK admin can only add to their own SUK
      if (isSukAdmin) {
        const mySuk = caller.sukId || (await getWorkerSukId(caller.workerId));
        if (!mySuk || !sukIds.includes(mySuk)) return err('You can only add workers to your own SUK', 403);
      }

      // Insert worker
      await sql`
        INSERT INTO workers (id, name, phone, email, suk_ids, role, is_active)
        VALUES (${newId}, ${d.name}, ${d.phone || null}, ${d.email.toLowerCase().trim()}, ${sukIds}, ${role}, true)
      `;

      // Insert user (login account)
      const hash = hashPassword(d.tempPassword);
      await sql`
        INSERT INTO users (id, email, name, role, password_hash, worker_id, suk_id, is_active)
        VALUES (${userId}, ${d.email.toLowerCase().trim()}, ${d.name}, ${role}, ${hash}, ${newId}, ${primarySuk}, true)
        ON CONFLICT (email) DO NOTHING
      `;

      const [row] = await sql`SELECT * FROM workers WHERE id = ${newId}`;
      return ok(toApp(row), 201);
    }

    // ── PATCH — update worker ─────────────────────────────────────────────────
    if (event.httpMethod === 'PATCH' || event.httpMethod === 'PUT') {
      if (!isAnyAdmin) return err('Forbidden', 403);
      if (!id) return err('id is required');

      const d = body(event);

      // SUK admin can only manage workers in their SUK
      if (isSukAdmin) {
        const mySuk = caller.sukId || (await getWorkerSukId(caller.workerId));
        const [target] = await sql`SELECT suk_ids FROM workers WHERE id = ${id}`;
        if (!target || !target.suk_ids.includes(mySuk)) return err('Forbidden', 403);
      }

      await sql`
        UPDATE workers SET
          name      = COALESCE(${d.name      ?? null}, name),
          phone     = COALESCE(${d.phone     ?? null}, phone),
          email     = COALESCE(${d.email     ?? null}, email),
          suk_ids   = COALESCE(${d.sukIds    ?? null}, suk_ids),
          role      = COALESCE(${d.role      ?? null}, role),
          is_active = COALESCE(${d.isActive  ?? null}, is_active)
        WHERE id = ${id}
      `;

      // Sync is_active to the login account
      if (d.isActive !== undefined) {
        await sql`
          UPDATE users SET is_active = ${d.isActive}
          WHERE worker_id = ${id}
        `;
      }

      const [row] = await sql`SELECT * FROM workers WHERE id = ${id}`;
      return ok(toApp(row));
    }

    // ── DELETE — remove worker + login account (super_admin only) ────────────
    if (event.httpMethod === 'DELETE') {
      if (!isSuperAdmin) return err('Forbidden — super admin only', 403);
      if (!id) return err('id is required');

      // Safety: prevent self-deletion
      if (id === caller.workerId) return err('You cannot delete your own account', 400);

      // Clear all foreign key references before deleting
      await sql`UPDATE members  SET assigned_to  = NULL WHERE assigned_to  = ${id}`;
      await sql`UPDATE visits   SET visited_by   = NULL WHERE visited_by   = ${id}`;
      await sql`UPDATE payments SET recorded_by  = NULL WHERE recorded_by  = ${id}`;

      // Delete user login account
      await sql`DELETE FROM users WHERE worker_id = ${id}`;

      // Delete worker
      await sql`DELETE FROM workers WHERE id = ${id}`;

      return ok({ ok: true });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('workers error', e);
    return err(e.message || 'Internal server error', 500);
  }
};

// Helper — get the primary SUK for a worker when caller is a dp_worker
async function getWorkerSukId(workerId) {
  if (!workerId) return null;
  const [w] = await sql`SELECT suk_ids FROM workers WHERE id = ${workerId}`;
  return w?.suk_ids?.[0] || null;
}
