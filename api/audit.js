// GET /api/audit?memberId=xxx     — audit log for a member
// GET /api/audit?changedBy=xxx    — audit log for a worker (their activity)
// GET /api/audit?sukId=xxx        — all audit entries for a SUK (admin)

const { sql }         = require('./_db');
const { requireAuth } = require('./_auth');
const { ok, err, preflight } = require('./_response');

const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  try { requireAuth(event); }
  catch { return err('Unauthorised', 401); }

  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  const { memberId, changedBy, sukId } = event.queryStringParameters || {};

  try {
    let rows;

    if (memberId) {
      // Audit log for a single member
      rows = await sql`
        SELECT a.id, a.member_id, a.changed_by, a.event,
               a.field, a.old_value, a.new_value, a.changed_at,
               w.name AS changed_by_name,
               m.name AS member_name
        FROM member_audit_log a
        LEFT JOIN workers w ON w.id = a.changed_by
        LEFT JOIN members m ON m.id = a.member_id
        WHERE a.member_id = ${memberId}
        ORDER BY a.changed_at DESC
        LIMIT 200
      `;
    } else if (changedBy) {
      // All activity by a specific worker
      rows = await sql`
        SELECT a.id, a.member_id, a.changed_by, a.event,
               a.field, a.old_value, a.new_value, a.changed_at,
               w.name AS changed_by_name,
               m.name AS member_name
        FROM member_audit_log a
        LEFT JOIN workers w ON w.id = a.changed_by
        LEFT JOIN members m ON m.id = a.member_id
        WHERE a.changed_by = ${changedBy}
        ORDER BY a.changed_at DESC
        LIMIT 500
      `;
    } else if (sukId) {
      // All audit entries for members in a SUK
      rows = await sql`
        SELECT a.id, a.member_id, a.changed_by, a.event,
               a.field, a.old_value, a.new_value, a.changed_at,
               w.name AS changed_by_name,
               m.name AS member_name
        FROM member_audit_log a
        LEFT JOIN workers w ON w.id = a.changed_by
        LEFT JOIN members m ON m.id = a.member_id
        WHERE m.suk_id = ${sukId}
        ORDER BY a.changed_at DESC
        LIMIT 1000
      `;
    } else {
      return err('Provide memberId, changedBy, or sukId');
    }

    return ok(rows.map(r => ({
      id:            r.id,
      memberId:      r.member_id,
      memberName:    r.member_name || 'Unknown',
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

module.exports = require('./_vercel')(handler);
