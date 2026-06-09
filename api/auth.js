// POST /api/auth/login  — validate credentials, return JWT
// POST /api/auth/logout — (stateless JWT: handled client-side)

const { sql }                           = require('./_db');
const { createToken, verifyPassword }   = require('./_auth');
const { ok, err, preflight, body }      = require('./_response');

const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  const { email, password } = body(event);
  if (!email || !password) return err('Email and password required');

  try {
    const [user] = await sql`
      SELECT id, email, name, role, password_hash, worker_id, suk_id, is_active
      FROM users
      WHERE email = ${email.toLowerCase().trim()}
    `;

    if (!user) return err('Invalid email or password', 401);

    const valid = verifyPassword(password, user.password_hash);
    if (!valid) return err('Invalid email or password', 401);

    if (user.is_active === false) return err('Your account has been deactivated. Please contact your admin.', 403);

    const token = createToken({
      userId:   user.id,
      email:    user.email,
      name:     user.name,
      role:     user.role,
      workerId: user.worker_id,
      sukId:    user.suk_id,
    });

    return ok({
      token,
      user: {
        id:       user.id,
        email:    user.email,
        name:     user.name,
        role:     user.role,
        workerId: user.worker_id,
        sukId:    user.suk_id,
      },
    });
  } catch (e) {
    console.error('auth error', e)
    return err('Server error', 500);
  }
};

module.exports = require('./_vercel')(handler);
