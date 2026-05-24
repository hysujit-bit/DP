// GET    /api/drives?sukId=bngg   — list drives for a SUK
// POST   /api/drives              — create drive
// PATCH  /api/drives?id=xxx      — update drive (status, retrospect, etc.)
// DELETE /api/drives?id=xxx      — delete drive

const { sql }                        = require('./_db');
const { requireAuth }                = require('./_auth');
const { ok, err, preflight, body }   = require('./_response');

function toApp(row) {
  return {
    id:          row.id,
    sukId:       row.suk_id,
    title:       row.title,
    date:        row.date,
    status:      row.status,
    memberIds:   row.member_ids  || [],
    workerIds:   row.worker_ids  || [],
    retrospect:  row.retrospect  || {},
    notes:       row.notes,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  try { requireAuth(event); }
  catch { return err('Unauthorised', 401); }

  const { id, sukId } = event.queryStringParameters || {};

  try {
    if (event.httpMethod === 'GET') {
      if (!sukId) return err('sukId is required');
      const rows = await sql`SELECT * FROM drives WHERE suk_id = ${sukId} ORDER BY date DESC`;
      return ok(rows.map(toApp));
    }

    if (event.httpMethod === 'POST') {
      const d = body(event);
      const newId = `dr_${Date.now().toString(36)}`;

      await sql`
        INSERT INTO drives (id, suk_id, title, date, status, member_ids, worker_ids, retrospect, notes)
        VALUES (
          ${newId}, ${d.sukId}, ${d.title}, ${d.date},
          ${d.status || 'UPCOMING'},
          ${d.memberIds || []},
          ${d.workerIds || []},
          ${JSON.stringify(d.retrospect || {})},
          ${d.notes || null}
        )
      `;

      const [row] = await sql`SELECT * FROM drives WHERE id = ${newId}`;
      return ok(toApp(row), 201);
    }

    if (event.httpMethod === 'PATCH' || event.httpMethod === 'PUT') {
      if (!id) return err('id is required');
      const d = body(event);

      // Build update dynamically — only update provided fields
      await sql`
        UPDATE drives SET
          title       = COALESCE(${d.title      ?? null}, title),
          date        = COALESCE(${d.date       ?? null}, date),
          status      = COALESCE(${d.status     ?? null}, status),
          member_ids  = COALESCE(${d.memberIds  ?? null}, member_ids),
          worker_ids  = COALESCE(${d.workerIds  ?? null}, worker_ids),
          retrospect  = CASE WHEN ${d.retrospect !== undefined} THEN ${JSON.stringify(d.retrospect ?? {})}::jsonb ELSE retrospect END,
          notes       = COALESCE(${d.notes      ?? null}, notes),
          updated_at  = NOW()
        WHERE id = ${id}
      `;

      const [row] = await sql`SELECT * FROM drives WHERE id = ${id}`;
      return ok(toApp(row));
    }

    if (event.httpMethod === 'DELETE') {
      if (!id) return err('id is required');
      await sql`DELETE FROM drives WHERE id = ${id}`;
      return ok({ ok: true });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('drives error', e);
    return err('Server error', 500);
  }
};
