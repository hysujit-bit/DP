// GET  /api/payments?sukId=bngg       — all payments for a SUK
// GET  /api/payments?personId=xxx     — payments for one member
// POST /api/payments                  — record a payment

const { sql }                        = require('./_db');
const { requireAuth }                = require('./_auth');
const { ok, err, preflight, body }   = require('./_response');

function toApp(row) {
  return {
    id:            row.id,
    personId:      row.person_id,
    familyCode:    row.family_code,
    recordedBy:    row.recorded_by,
    paymentDate:   row.payment_date,
    monthCovered:  row.month_covered,
    status:        row.status,
    createdAt:     row.created_at,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  let caller;
  try { caller = requireAuth(event); }
  catch { return err('Unauthorised', 401); }

  const { sukId, personId } = event.queryStringParameters || {};

  try {
    if (event.httpMethod === 'GET') {
      let rows;
      if (personId) {
        rows = await sql`SELECT * FROM payments WHERE person_id = ${personId} ORDER BY payment_date DESC`;
      } else if (sukId) {
        rows = await sql`
          SELECT p.* FROM payments p
          JOIN members m ON m.id = p.person_id
          WHERE m.suk_id = ${sukId}
          ORDER BY p.payment_date DESC
        `;
      } else {
        return err('sukId or personId required');
      }
      return ok(rows.map(toApp));
    }

    if (event.httpMethod === 'POST') {
      const d = body(event);
      const newId = `p_${Date.now().toString(36)}`;

      await sql`
        INSERT INTO payments (id, person_id, family_code, recorded_by, payment_date, month_covered, status)
        VALUES (${newId}, ${d.personId}, ${d.familyCode || null}, ${d.recordedBy || null},
                ${d.paymentDate}, ${d.monthCovered}, ${d.status || 'SENT'})
      `;

      const [row] = await sql`SELECT * FROM payments WHERE id = ${newId}`;
      return ok(toApp(row), 201);
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('payments error', e);
    return err('Server error', 500);
  }
};
