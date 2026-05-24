// GET   /api/workers             — list all workers
// POST  /api/workers             — create worker (admin only)
// PATCH /api/workers?id=xxx     — update worker (admin only)

const { sql }                        = require('./_db');
const { requireAuth }                = require('./_auth');
const { ok, err, preflight, body }   = require('./_response');

function toApp(row) {
  return {
    id:      row.id,
    name:    row.name,
    phone:   row.phone,
    email:   row.email,
    sukIds:  row.suk_ids || [],
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  try { requireAuth(event); }
  catch { return err('Unauthorised', 401); }

  const { id } = event.queryStringParameters || {};

  try {
    if (event.httpMethod === 'GET') {
      const rows = await sql`SELECT * FROM workers ORDER BY name`;
      return ok(rows.map(toApp));
    }

    if (event.httpMethod === 'POST') {
      const d = body(event);
      const newId = d.id || `w_${Date.now().toString(36)}`;

      await sql`
        INSERT INTO workers (id, name, phone, email, suk_ids)
        VALUES (${newId}, ${d.name}, ${d.phone || null}, ${d.email || null}, ${d.sukIds || []})
      `;

      const [row] = await sql`SELECT * FROM workers WHERE id = ${newId}`;
      return ok(toApp(row), 201);
    }

    if (event.httpMethod === 'PATCH' || event.httpMethod === 'PUT') {
      if (!id) return err('id is required');
      const d = body(event);

      await sql`
        UPDATE workers SET
          name     = COALESCE(${d.name    ?? null}, name),
          phone    = COALESCE(${d.phone   ?? null}, phone),
          email    = COALESCE(${d.email   ?? null}, email),
          suk_ids  = COALESCE(${d.sukIds  ?? null}, suk_ids)
        WHERE id = ${id}
      `;

      const [row] = await sql`SELECT * FROM workers WHERE id = ${id}`;
      return ok(toApp(row));
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('workers error', e);
    return err('Server error', 500);
  }
};
