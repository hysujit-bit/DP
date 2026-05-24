// GET    /api/members?sukId=bngg          — list active members for a SUK
// GET    /api/members?sukId=bngg&all=1   — include removed members
// POST   /api/members                     — create member
// PATCH  /api/members?id=xxx             — update member fields
// DELETE /api/members?id=xxx             — soft-delete (set is_active=false)

const { sql }            = require('./_db');
const { requireAuth }    = require('./_auth');
const { ok, err, preflight, body } = require('./_response');

function toApp(row) {
  return {
    id:                 row.id,
    name:               row.name,
    phone:              row.phone,
    address:            row.address,
    presentAddress:     row.present_address,
    geoLocation:        row.geo_location,
    memberCategory:     row.member_category,
    sukId:              row.suk_id,
    assignedTo:         row.assigned_to,
    familyCode:         row.family_code,
    ishtabhritiStatus:  row.ishtabhrity_status,
    isActive:           row.is_active,
    removedReason:      row.removed_reason,
    removedAt:          row.removed_at,
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  try {
    requireAuth(event);
  } catch {
    return err('Unauthorised', 401);
  }

  const { id, sukId, all } = event.queryStringParameters || {};

  try {
    // ── GET ──────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      if (!sukId) return err('sukId is required');
      const showAll = all === '1';

      const rows = showAll
        ? await sql`SELECT * FROM members WHERE suk_id = ${sukId} ORDER BY name`
        : await sql`SELECT * FROM members WHERE suk_id = ${sukId} AND is_active = TRUE ORDER BY name`;

      return ok(rows.map(toApp));
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const d = body(event);
      const newId = d.id || `m_${Date.now().toString(36)}`;

      await sql`
        INSERT INTO members
          (id, name, phone, address, present_address, geo_location,
           member_category, suk_id, assigned_to, family_code, ishtabhrity_status)
        VALUES
          (${newId}, ${d.name}, ${d.phone || null}, ${d.address || null},
           ${d.presentAddress || null}, ${d.geoLocation || null},
           ${d.memberCategory || 'PROSPECT'}, ${d.sukId}, ${d.assignedTo || null},
           ${d.familyCode || null}, ${d.ishtabhritiStatus || 'UNKNOWN'})
      `;

      const [row] = await sql`SELECT * FROM members WHERE id = ${newId}`;
      return ok(toApp(row), 201);
    }

    // ── PATCH ─────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'PATCH' || event.httpMethod === 'PUT') {
      if (!id) return err('id is required');
      const d = body(event);

      await sql`
        UPDATE members SET
          name               = COALESCE(${d.name             ?? null}, name),
          phone              = COALESCE(${d.phone            ?? null}, phone),
          address            = COALESCE(${d.address          ?? null}, address),
          present_address    = COALESCE(${d.presentAddress   ?? null}, present_address),
          geo_location       = COALESCE(${d.geoLocation      ?? null}, geo_location),
          member_category    = COALESCE(${d.memberCategory   ?? null}, member_category),
          assigned_to        = COALESCE(${d.assignedTo       ?? null}, assigned_to),
          family_code        = COALESCE(${d.familyCode       ?? null}, family_code),
          ishtabhrity_status = COALESCE(${d.ishtabhritiStatus ?? null}, ishtabhrity_status),
          is_active          = COALESCE(${d.isActive         ?? null}, is_active),
          removed_reason     = COALESCE(${d.removedReason    ?? null}, removed_reason),
          removed_at         = COALESCE(${d.removedAt        ?? null}, removed_at),
          updated_at         = NOW()
        WHERE id = ${id}
      `;

      const [row] = await sql`SELECT * FROM members WHERE id = ${id}`;
      return ok(toApp(row));
    }

    // ── DELETE (soft) ─────────────────────────────────────────────────────────
    if (event.httpMethod === 'DELETE') {
      if (!id) return err('id is required');
      const { reason } = body(event);

      await sql`
        UPDATE members
        SET is_active = FALSE, removed_reason = ${reason || null}, removed_at = NOW(), updated_at = NOW()
        WHERE id = ${id}
      `;
      return ok({ ok: true });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('members error', e);
    return err('Server error', 500);
  }
};
