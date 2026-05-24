// JWT helpers — no external package needed, uses Node's built-in crypto.
const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// ─── Token creation ───────────────────────────────────────────────────────────
function createToken(payload) {
  const header  = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = b64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const sig     = sign(`${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

// ─── Token verification ───────────────────────────────────────────────────────
function verifyToken(token) {
  if (!token) throw new Error('No token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [header, body, sig] = parts;
  const expected = sign(`${header}.${body}`);
  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('Invalid signature');
  }
  return JSON.parse(Buffer.from(body, 'base64url').toString());
}

// ─── Password hashing (scrypt) ────────────────────────────────────────────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const attempt = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attempt, 'hex'));
}

// ─── Extract token from request ───────────────────────────────────────────────
function extractToken(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

// ─── Require auth middleware ──────────────────────────────────────────────────
function requireAuth(event) {
  const token = extractToken(event);
  if (!token) throw new Error('Unauthorised');
  return verifyToken(token);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function b64url(str) {
  return Buffer.from(str).toString('base64url');
}
function sign(data) {
  return crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
}

module.exports = { createToken, verifyToken, hashPassword, verifyPassword, requireAuth };
