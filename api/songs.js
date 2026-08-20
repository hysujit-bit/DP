// GET    /api/songs                          — list songs (optional filters)
// GET    /api/songs?id=xxx                   — get single song
// POST   /api/songs                          — create song
// PATCH  /api/songs?id=xxx                   — update song
// DELETE /api/songs?id=xxx                   — soft-delete (set is_active=false)

const { sql }            = require('./_db');
const { requireAuth }    = require('./_auth');
const { ok, err, preflight, body } = require('./_response');

function toApp(row) {
  return {
    id:             row.id,
    title:          row.title,
    author:         row.author,
    language:       row.language,
    titleSearch:    row.title_search,
    authorSearch:   row.author_search,
    lyrics:         row.lyrics,
    lyricsSearch:   row.lyrics_search,
    category:       row.category,
    tags:           row.tags || [],
    searchKeywords: row.search_keywords,
    contentType:    row.content_type,
    pageImages:     row.page_images || [],
    pdfFiles:       row.pdf_files || [],
    bookSource:     row.book_source,
    pageNumber:     row.page_number,
    notes:          row.notes,
    isActive:       row.is_active,
    createdBy:      row.created_by,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
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

  const { id, category, language, q, tag, book } = event.queryStringParameters || {};

  try {
    // ── GET ──────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      // Single song detail
      if (id) {
        const [row] = await sql`SELECT * FROM songs WHERE id = ${id} AND is_active = TRUE`;
        if (!row) return err('Song not found', 404);
        return ok(toApp(row));
      }

      // Build query with filters
      let rows;
      if (q) {
        // English search across title_search, lyrics_search, author_search, search_keywords, tags
        const searchTerm = `%${q}%`;
        rows = await sql`
          SELECT * FROM songs
          WHERE is_active = TRUE
            AND (
              title_search ILIKE ${searchTerm}
              OR lyrics_search ILIKE ${searchTerm}
              OR author_search ILIKE ${searchTerm}
              OR search_keywords ILIKE ${searchTerm}
              OR ${q} = ANY(tags)
            )
          ORDER BY title
        `;
      } else if (category && language) {
        rows = await sql`SELECT * FROM songs WHERE is_active = TRUE AND category = ${category} AND language = ${language} ORDER BY title`;
      } else if (category) {
        rows = await sql`SELECT * FROM songs WHERE is_active = TRUE AND category = ${category} ORDER BY title`;
      } else if (language) {
        rows = await sql`SELECT * FROM songs WHERE is_active = TRUE AND language = ${language} ORDER BY title`;
      } else if (tag) {
        rows = await sql`SELECT * FROM songs WHERE is_active = TRUE AND ${tag} = ANY(tags) ORDER BY title`;
      } else if (book) {
        rows = await sql`SELECT * FROM songs WHERE is_active = TRUE AND book_source = ${book} ORDER BY title`;
      } else {
        rows = await sql`SELECT * FROM songs WHERE is_active = TRUE ORDER BY title`;
      }

      return ok(rows.map(toApp));
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const d = body(event);

      if (!d.title) return err('Title is required');
      if (!d.titleSearch) return err('Title Search (English transliteration) is required');
      if (!d.category) return err('Category is required');

      const newId = d.id || `s_${Date.now().toString(36)}`;

      await sql`
        INSERT INTO songs (
          id, title, author, language, title_search, author_search,
          lyrics, lyrics_search, category, tags, search_keywords,
          content_type, page_images, pdf_files,
          book_source, page_number, notes, created_by
        ) VALUES (
          ${newId},
          ${d.title},
          ${d.author || null},
          ${d.language || 'Odia'},
          ${d.titleSearch},
          ${d.authorSearch || null},
          ${d.lyrics || null},
          ${d.lyricsSearch || null},
          ${d.category || 'BHAJAN'},
          ${d.tags || []},
          ${d.searchKeywords || null},
          ${d.contentType || 'text'},
          ${d.pageImages || []},
          ${d.pdfFiles || []},
          ${d.bookSource || null},
          ${d.pageNumber || null},
          ${d.notes || null},
          ${caller?.workerId || null}
        )
      `;

      const [row] = await sql`SELECT * FROM songs WHERE id = ${newId}`;
      return ok(toApp(row), 201);
    }

    // ── PATCH ────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'PATCH' || event.httpMethod === 'PUT') {
      if (!id) return err('id is required');
      const d = body(event);

      const [before] = await sql`SELECT * FROM songs WHERE id = ${id}`;
      if (!before) return err('Song not found', 404);

      await sql`
        UPDATE songs SET
          title           = COALESCE(${d.title          ?? null}, title),
          author          = COALESCE(${d.author         ?? null}, author),
          language        = COALESCE(${d.language       ?? null}, language),
          title_search    = COALESCE(${d.titleSearch   ?? null}, title_search),
          author_search   = COALESCE(${d.authorSearch  ?? null}, author_search),
          lyrics          = COALESCE(${d.lyrics         ?? null}, lyrics),
          lyrics_search   = COALESCE(${d.lyricsSearch   ?? null}, lyrics_search),
          category        = COALESCE(${d.category       ?? null}, category),
          tags            = COALESCE(${d.tags           ?? null}, tags),
          search_keywords = COALESCE(${d.searchKeywords ?? null}, search_keywords),
          content_type    = COALESCE(${d.contentType    ?? null}, content_type),
          page_images     = COALESCE(${d.pageImages     ?? null}, page_images),
          pdf_files       = COALESCE(${d.pdfFiles       ?? null}, pdf_files),
          book_source     = COALESCE(${d.bookSource     ?? null}, book_source),
          page_number     = COALESCE(${d.pageNumber     ?? null}, page_number),
          notes           = COALESCE(${d.notes          ?? null}, notes),
          updated_at      = NOW()
        WHERE id = ${id}
      `;

      const [row] = await sql`SELECT * FROM songs WHERE id = ${id}`;
      return ok(toApp(row));
    }

    // ── DELETE (soft) ────────────────────────────────────────────────────────
    if (event.httpMethod === 'DELETE') {
      if (!id) return err('id is required');

      await sql`
        UPDATE songs SET is_active = FALSE, updated_at = NOW() WHERE id = ${id}
      `;

      return ok({ ok: true });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('songs error', e);
    return err('Server error', 500);
  }
};

module.exports = require('./_vercel')(handler);
