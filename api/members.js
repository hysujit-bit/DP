// GET    /api/members?sukId=bngg          — list active members for a SUK
// GET    /api/members?sukId=bngg&all=1   — include removed members
// POST   /api/members                     — create member
// PATCH  /api/members?id=xxx             — update member fields
// DELETE /api/members?id=xxx             — soft-delete (set is_active=false)

const { sql }            = require('./_db');
const { requireAuth }    = require('./_auth');
const { ok, err, preflight, body } = require('./_response');

// Neon HTTP driver returns DATE columns as JS Date objects; normalise to YYYY-MM-DD strings
function fmtDate(d) {
  if (!d) return null;
  return (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10);
}

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
    ishtabhritiStartDate: fmtDate(row.ishtabhrity_start_date),
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
    photoUrl:             row.photo_url,
    // status fields
    initiationDate:       fmtDate(row.initiation_date),
    alternatePhone:       row.alternate_phone,
    isActive:             row.is_active,
    isRemoved:            row.is_active === false,
    removedReason:        row.removed_reason,
    removedAt:            row.removed_at,
    createdAt:            row.created_at,
    updatedAt:            row.updated_at,
  };
}

const handler = async (event) => {
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
          swastaini, new_in_bengaluru, initiation_date, alternate_phone, photo_url
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
          ${d.swastaini || false}, ${d.newInBengaluru || false},
          ${d.initiationDate || null}, ${d.alternatePhone || null},
          ${d.photoUrl || null}
        )
      `;

      const [row] = await sql`SELECT * FROM members WHERE id = ${newId}`;

      // Log creation
      const createdBy = d.changedBy || caller?.workerId || null;
      if (createdBy) {
        await sql`UPDATE members SET created_by = ${createdBy} WHERE id = ${newId}`.catch(() => {});
      }
      const auditId = `al_${Date.now().toString(36)}_new`;
      await sql`
        INSERT INTO member_audit_log (id, member_id, changed_by, event)
        VALUES (${auditId}, ${newId}, ${createdBy}, 'member_created')
      `.catch(() => {});

      return ok(toApp(row), 201);
    }

    // ── PATCH ─────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'PATCH' || event.httpMethod === 'PUT') {
      if (!id) return err('id is required');
      const d = body(event);

      // Fetch current row so we can diff for audit log
      const [before] = await sql`SELECT * FROM members WHERE id = ${id}`;
      if (!before) return err('Member not found', 404);

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
          initiation_date       = COALESCE(${d.initiationDate      ?? null}, initiation_date),
          alternate_phone       = COALESCE(${d.alternatePhone      ?? null}, alternate_phone),
          photo_url             = COALESCE(${d.photoUrl            ?? null}, photo_url),
          is_active             = COALESCE(${d.isActive            ?? null}, is_active),
          removed_reason        = CASE WHEN ${clearRemoved} THEN NULL ELSE COALESCE(${d.removedReason ?? null}, removed_reason) END,
          removed_at            = CASE WHEN ${clearRemoved} THEN NULL ELSE COALESCE(${d.removedAt     ?? null}, removed_at)     END,
          updated_at            = NOW()
        WHERE id = ${id}
      `;

      // ── Write audit rows for changed fields ─────────────────────────────────
      const TRACKED = [
        ['name',                  'Name',                  before.name],
        ['contact_no',            'Contact Number',        before.contact_no],
        ['member_category',       'Member Category',       before.member_category],
        ['ishtabhrity_status',    'Ishtabhrity Status',    before.ishtabhrity_status],
        ['ishtabhrity_start_date','Ishtabhrity Start Date',before.ishtabhrity_start_date ? String(before.ishtabhrity_start_date).slice(0,10) : null],
        ['dp_status',             'DP Status',             before.dp_status],
        ['assigned_to',           'Assigned To',           before.assigned_to],
        ['address',               'Home Address',          before.address],
        ['present_address',       'Present Address',       before.present_address],
        ['permanent_address',     'Permanent Address',     before.permanent_address],
        ['family_code',           'Family Code',           before.family_code],
        ['guardian_name',         'Guardian Name',         before.guardian_name],
        ['ritwik_name',           'Ritwik Name',           before.ritwik_name],
        ['profession',            'Profession',            before.profession],
        ['area',                  'Area',                  before.area],
        ['pin_code',              'Pin Code',              before.pin_code],
        ['has_asthan',            'Has Thakur Asthan',     String(before.has_asthan)],
        ['is_adikshita',          'Adikshita',             String(before.is_adikshita)],
        ['recently_took_dikhya',  'Recently Took Dikhya',  String(before.recently_took_dikhya)],
        ['plays_harmonium',       'Plays Harmonium',       String(before.plays_harmonium)],
        ['spouse_prospect',       'Spouse Prospect',       String(before.spouse_prospect)],
        ['children_prospect',     'Children Prospect',     String(before.children_prospect)],
        ['interested_in_singing', 'Interested in Singing', String(before.interested_in_singing)],
        ['can_help_in_dp_work',   'Can Help in DP Work',   String(before.can_help_in_dp_work)],
        ['comes_to_satsang',      'Comes to Satsang',      String(before.comes_to_satsang)],
        ['keeps_prayer',          'Keeps Prayer',          String(before.keeps_prayer)],
        ['keeps_bhadra_satsang',  'Keeps Bhadra Satsang',  String(before.keeps_bhadra_satsang)],
        ['does_dp_work',          'Does DP Work',          String(before.does_dp_work)],
        ['goes_to_temple',        'Goes to Temple',        String(before.goes_to_temple)],
        ['deoghark_visit',        'Deoghark Visit',        String(before.deoghark_visit)],
        ['swastaini',             'Swastaini',             String(before.swastaini)],
        ['new_in_bengaluru',      'New in Bengaluru',      String(before.new_in_bengaluru)],
        ['initiation_date',       'Initiation Date',       before.initiation_date ? String(before.initiation_date).slice(0,10) : null],
        ['alternate_phone',       'Alternate Phone',       before.alternate_phone],
        ['photo_url',             'Profile Photo',         before.photo_url],
        ['is_active',             'Active Status',         String(before.is_active)],
      ];

      // Map incoming d keys to db column names for comparison
      const incoming = {
        name: d.name, contact_no: d.contactNo, member_category: d.memberCategory,
        ishtabhrity_status: d.ishtabhritiStatus,
        ishtabhrity_start_date: d.ishtabhritiStartDate,
        dp_status: d.dpStatus, assigned_to: d.assignedTo,
        address: d.address, present_address: d.presentAddress,
        permanent_address: d.permanentAddress, family_code: d.familyCode,
        guardian_name: d.guardianName, ritwik_name: d.ritwikName,
        profession: d.profession, area: d.area, pin_code: d.pinCode,
        has_asthan: d.hasAsthan, is_adikshita: d.isAdikshita,
        recently_took_dikhya: d.recentlyTookDikhya, plays_harmonium: d.playsHarmonium,
        spouse_prospect: d.spouseProspect, children_prospect: d.childrenProspect,
        interested_in_singing: d.interestedInSinging, can_help_in_dp_work: d.canHelpInDPWork,
        comes_to_satsang: d.comesToSatsang, keeps_prayer: d.keepsPrayer,
        keeps_bhadra_satsang: d.keepsBhadraSatsang, does_dp_work: d.doesDPWork,
        goes_to_temple: d.goesToTemple, deoghark_visit: d.deogharkVisit,
        swastaini: d.swastaini, new_in_bengaluru: d.newInBengaluru,
        initiation_date: d.initiationDate, alternate_phone: d.alternatePhone,
        photo_url: d.photoUrl,
        is_active: d.isActive,
      };

      const changedBy = d.changedBy || caller?.workerId || null;
      const auditRows = [];

      for (const [col, label, oldRaw] of TRACKED) {
        const newVal = incoming[col];
        if (newVal === undefined || newVal === null) continue;
        const oldStr = oldRaw == null ? '' : String(oldRaw);
        const newStr = String(newVal);
        if (oldStr === newStr) continue;
        auditRows.push({ col, label, oldStr, newStr });
      }

      if (auditRows.length > 0) {
        for (const { label, oldStr, newStr } of auditRows) {
          const auditId = `al_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
          await sql`
            INSERT INTO member_audit_log (id, member_id, changed_by, event, field, old_value, new_value)
            VALUES (${auditId}, ${id}, ${changedBy}, 'field_changed', ${label}, ${oldStr || null}, ${newStr})
          `.catch(() => {}); // non-fatal — don't break the update if audit table missing
        }
      }

      const [row] = await sql`SELECT * FROM members WHERE id = ${id}`;
      return ok(toApp(row));
    }

    // ── DELETE (soft) ─────────────────────────────────────────────────────────
    if (event.httpMethod === 'DELETE') {
      if (!id) return err('id is required');
      const d = body(event);
      const { reason, changedBy } = d;
      const callerWorkerId = changedBy || caller?.workerId || null;

      await sql`
        UPDATE members
        SET is_active = FALSE, removed_reason = ${reason || null}, removed_at = NOW(), updated_at = NOW()
        WHERE id = ${id}
      `;

      // Log removal
      const auditId = `al_${Date.now().toString(36)}_rem`;
      await sql`
        INSERT INTO member_audit_log (id, member_id, changed_by, event, field, old_value, new_value)
        VALUES (${auditId}, ${id}, ${callerWorkerId}, 'member_removed', 'Active Status', 'true', 'false')
      `.catch(() => {});

      return ok({ ok: true });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('members error', e);
    return err('Server error', 500);
  }
};

module.exports = require('./_vercel')(handler);
