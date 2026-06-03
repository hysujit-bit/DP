// GET /api/audit?memberId=xxx  — fetch audit log for a member (most recent first)

const { sql }         = require('./_db');
const { requireAuth } = require('./_auth');
const { ok, err, preflight } = require('./_response');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  try { requireAuth(event); }
  catch { return err('Unauthorised', 401); }

  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  const { memberId } = event.queryStringParameters || {};
  if (!memberId) return err('memberId is required');

  try {
    const rows = await sql`
      SELECT
        a.id, a.member_id, a.changed_by, a.event,
        a.field, a.old_value, a.new_value, a.changed_at,
        w.name AS changed_by_name
      FROM member_audit_log a
      LEFT JOIN workers w ON w.id = a.changed_by
      WHERE a.member_id = ${memberId}
      ORDER BY a.changed_at DESC
      LIMIT 200
    `;

    return ok(rows.map(r => ({
      id:            r.id,
      memberId:      r.member_id,
      changedBy:     r.changed_by,
      changedByName: r.changed_by_name || 'Unknown',
      event:         r.event,
      field:         r.field,
      oldValue:      r.old_value,
      newValue:      r.new_value,
      changedAt:     r.changed_at,
    })));
  } catch (e) {
    console.error('audit error', e);
    return err('Server error', 500);
  }
};
