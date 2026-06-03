// GET  /api/visits?sukId=bngg        — all visits for a SUK
// GET  /api/visits?personId=xxx      — visits for one member
// POST /api/visits                   — log a new visit
// PATCH /api/visits?id=xxx           — update a visit

const { sql }                        = require('./_db');
const { requireAuth }                = require('./_auth');
const { ok, err, preflight, body }   = require('./_response');

// Neon HTTP driver returns DATE columns as JS Date objects; normalise to YYYY-MM-DD strings
function fmtDate(d) {
  if (!d) return null;
  return (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10);
}

function toApp(row) {
  return {
    id:          row.id,
    personId:    row.person_id,
    visitedBy:   row.visited_by,
    visitDate:   fmtDate(row.visit_date),
    outcome:     row.outcome,
    notes:       row.notes,
    nextAction:  row.next_action,
    tookDikhya:  row.took_dikhya,
    createdAt:   row.created_at,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  let caller;
  try { caller = requireAuth(event); }
  catch { return err('Unauthorised', 401); }

  const { id, sukId, personId } = event.queryStringParameters || {};

  try {
    if (event.httpMethod === 'GET') {
      let rows;
      if (personId) {
        rows = await sql`SELECT * FROM visits WHERE person_id = ${personId} ORDER BY visit_date DESC`;
      } else if (sukId) {
        rows = await sql`
          SELECT v.* FROM visits v
          JOIN members m ON m.id = v.person_id
          WHERE m.suk_id = ${sukId}
          ORDER BY v.visit_date DESC
        `;
      } else {
        return err('sukId or personId required');
      }
      return ok(rows.map(toApp));
    }

    if (event.httpMethod === 'POST') {
      const d = body(event);
      const newId = `v_${Date.now().toString(36)}`;

      await sql`
        INSERT INTO visits (id, person_id, visited_by, visit_date, outcome, notes, next_action, took_dikhya)
        VALUES (${newId}, ${d.personId}, ${d.visitedBy || null},
                ${d.visitDate}, ${d.outcome || null}, ${d.notes || null},
                ${d.nextAction || null}, ${d.tookDikhya || false})
      `;

      const [row] = await sql`SELECT * FROM visits WHERE id = ${newId}`;
      return ok(toApp(row), 201);
    }

    if (event.httpMethod === 'PATCH' || event.httpMethod === 'PUT') {
      if (!id) return err('id is required');
      const d = body(event);

      await sql`
        UPDATE visits SET
          visit_date  = COALESCE(${d.visitDate  ?? null}, visit_date),
          visited_by  = COALESCE(${d.visitedBy  ?? null}, visited_by),
          outcome     = COALESCE(${d.outcome    ?? null}, outcome),
          notes       = COALESCE(${d.notes      ?? null}, notes),
          next_action = COALESCE(${d.nextAction ?? null}, next_action),
          took_dikhya = COALESCE(${d.tookDikhya ?? null}, took_dikhya)
        WHERE id = ${id}
      `;

      const [row] = await sql`SELECT * FROM visits WHERE id = ${id}`;
      return ok(toApp(row));
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('visits error', e);
    return err('Server error', 500);
  }
};
