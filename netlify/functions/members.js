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
    id:                   row.id,
    name:                 row.name,
    contactNo:            row.contact_no,
    address:              row.address,
    presentAddress:       row.present_address,
    permanentAddress:     row.permanent_address,
    geoLocation:          row.geo_location,
    memberCategory:       row.member_category,
    sukId:                row.suk_id,
    assignedTo:           row.assigned_to,
    familyCode:           row.family_code,
    guardianName:         row.guardian_name,
    ritwikName:           row.ritwik_name,
    dpStatus:             row.dp_status,
    ishtabhritiStatus:    row.ishtabhrity_status,
    ishtabhritiStartDate: row.ishtabhrity_start_date,
    profession:           row.profession,
    area:                 row.area,
    pinCode:              row.pin_code,
    // boolean attributes
    hasAsthan:            row.has_asthan            || false,
    isAdikshita:          row.is_adikshita          || false,
    recentlyTookDikhya:   row.recently_took_dikhya  || false,
    playsHarmonium:       row.plays_harmonium        || false,
    spouseProspect:       row.spouse_prospect        || false,
    childrenProspect:     row.children_prospect      || false,
    interestedInSinging:  row.interested_in_singing  || false,
    canHelpInDPWork:      row.can_help_in_dp_work    || false,
    sharesRoom:           row.shares_room            || false,
    staysInPG:            row.stays_in_pg            || false,
    keepsPrayer:          row.keeps_prayer           || false,
    comesToSatsang:       row.comes_to_satsang       || false,
    keepsBhadraSatsang:   row.keeps_bhadra_satsang   || false,
    doesDPWork:           row.does_dp_work           || false,
    goesToTemple:         row.goes_to_temple         || false,
    deogharkVisit:        row.deoghark_visit         || false,
    swastaini:            row.swastaini              || false,
    newInBengaluru:       row.new_in_bengaluru       || false,
    // status fields
    isActive:             row.is_active,
    isRemoved:            row.is_active === false,
    removedReason:        row.removed_reason,
    removedAt:            row.removed_at,
    createdAt:            row.created_at,
    updatedAt:            row.updated_at,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  let caller;
  try {
    caller = requireAuth(event);
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
        INSERT INTO members (
          id, name, contact_no, address, present_address, permanent_address, geo_location,
          member_category, suk_id, assigned_to, family_code,
          guardian_name, ritwik_name, dp_status, ishtabhrity_status, ishtabhrity_start_date,
          profession, area, pin_code,
          has_asthan, is_adikshita, recently_took_dikhya, plays_harmonium,
          spouse_prospect, children_prospect, interested_in_singing, can_help_in_dp_work,
          shares_room, stays_in_pg, keeps_prayer, comes_to_satsang,
          keeps_bhadra_satsang, does_dp_work, goes_to_temple, deoghark_visit,
          swastaini, new_in_bengaluru
        ) VALUES (
          ${newId}, ${d.name}, ${d.contactNo || null}, ${d.address || null},
          ${d.presentAddress || null}, ${d.permanentAddress || null}, ${d.geoLocation || null},
          ${d.memberCategory || 'PROSPECT'}, ${d.sukId}, ${d.assignedTo || null},
          ${d.familyCode || null},
          ${d.guardianName || null}, ${d.ritwikName || null},
          ${d.dpStatus || 'FW_PENDING'}, ${d.ishtabhritiStatus || 'UNKNOWN'},
          ${d.ishtabhritiStartDate || null},
          ${d.profession || null}, ${d.area || null}, ${d.pinCode || null},
          ${d.hasAsthan || false}, ${d.isAdikshita || false}, ${d.recentlyTookDikhya || false},
          ${d.playsHarmonium || false}, ${d.spouseProspect || false}, ${d.childrenProspect || false},
          ${d.interestedInSinging || false}, ${d.canHelpInDPWork || false},
          ${d.sharesRoom || false}, ${d.staysInPG || false}, ${d.keepsPrayer || false},
          ${d.comesToSatsang || false}, ${d.keepsBhadraSatsang || false}, ${d.doesDPWork || false},
          ${d.goesToTemple || false}, ${d.deogharkVisit || false},
          ${d.swastaini || false}, ${d.newInBengaluru || false}
        )
      `;

      const [row] = await sql`SELECT * FROM members WHERE id = ${newId}`;
      return ok(toApp(row), 201);
    }

    // ── PATCH ─────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'PATCH' || event.httpMethod === 'PUT') {
      if (!id) return err('id is required');
      const d = body(event);

      // For restore: explicitly clear removed fields when isActive is being set to true
      const clearRemoved = d.isActive === true;

      await sql`
        UPDATE members SET
          name                  = COALESCE(${d.name                ?? null}, name),
          contact_no            = COALESCE(${d.contactNo           ?? null}, contact_no),
          address               = COALESCE(${d.address             ?? null}, address),
          present_address       = COALESCE(${d.presentAddress      ?? null}, present_address),
          permanent_address     = COALESCE(${d.permanentAddress    ?? null}, permanent_address),
          geo_location          = COALESCE(${d.geoLocation         ?? null}, geo_location),
          member_category       = COALESCE(${d.memberCategory      ?? null}, member_category),
          assigned_to           = COALESCE(${d.assignedTo          ?? null}, assigned_to),
          family_code           = COALESCE(${d.familyCode          ?? null}, family_code),
          guardian_name         = COALESCE(${d.guardianName        ?? null}, guardian_name),
          ritwik_name           = COALESCE(${d.ritwikName          ?? null}, ritwik_name),
          dp_status             = COALESCE(${d.dpStatus            ?? null}, dp_status),
          ishtabhrity_status    = COALESCE(${d.ishtabhritiStatus   ?? null}, ishtabhrity_status),
          ishtabhrity_start_date= COALESCE(${d.ishtabhritiStartDate?? null}, ishtabhrity_start_date),
          profession            = COALESCE(${d.profession          ?? null}, profession),
          area                  = COALESCE(${d.area                ?? null}, area),
          pin_code              = COALESCE(${d.pinCode             ?? null}, pin_code),
          has_asthan            = COALESCE(${d.hasAsthan           ?? null}, has_asthan),
          is_adikshita          = COALESCE(${d.isAdikshita         ?? null}, is_adikshita),
          recently_took_dikhya  = COALESCE(${d.recentlyTookDikhya ?? null}, recently_took_dikhya),
          plays_harmonium       = COALESCE(${d.playsHarmonium      ?? null}, plays_harmonium),
          spouse_prospect       = COALESCE(${d.spouseProspect      ?? null}, spouse_prospect),
          children_prospect     = COALESCE(${d.childrenProspect    ?? null}, children_prospect),
          interested_in_singing = COALESCE(${d.interestedInSinging ?? null}, interested_in_singing),
          can_help_in_dp_work   = COALESCE(${d.canHelpInDPWork     ?? null}, can_help_in_dp_work),
          shares_room           = COALESCE(${d.sharesRoom          ?? null}, shares_room),
          stays_in_pg           = COALESCE(${d.staysInPG           ?? null}, stays_in_pg),
          keeps_prayer          = COALESCE(${d.keepsPrayer         ?? null}, keeps_prayer),
          comes_to_satsang      = COALESCE(${d.comesToSatsang      ?? null}, comes_to_satsang),
          keeps_bhadra_satsang  = COALESCE(${d.keepsBhadraSatsang  ?? null}, keeps_bhadra_satsang),
          does_dp_work          = COALESCE(${d.doesDPWork          ?? null}, does_dp_work),
          goes_to_temple        = COALESCE(${d.goesToTemple        ?? null}, goes_to_temple),
          deoghark_visit        = COALESCE(${d.deogharkVisit       ?? null}, deoghark_visit),
          swastaini             = COALESCE(${d.swastaini           ?? null}, swastaini),
          new_in_bengaluru      = COALESCE(${d.newInBengaluru      ?? null}, new_in_bengaluru),
          is_active             = COALESCE(${d.isActive            ?? null}, is_active),
          removed_reason        = ${clearRemoved ? null : sql`COALESCE(${d.removedReason ?? null}, removed_reason)`},
          removed_at            = ${clearRemoved ? null : sql`COALESCE(${d.removedAt ?? null}, removed_at)`},
          updated_at            = NOW()
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
