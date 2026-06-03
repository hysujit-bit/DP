// Shared Neon database client for all Netlify Functions
// Uses @neondatabase/serverless — optimised for short-lived serverless connections.

const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// neon() returns a tagged-template SQL function.
// Usage: const rows = await sql`SELECT * FROM members WHERE suk_id = ${sukId}`
const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };
