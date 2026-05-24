// PATCH /api/users  — change own password
// Only the authenticated user can change their own password.

const { sql }                              = require('./_db');
const { requireAuth, hashPassword, verifyPassword } = require('./_auth');
const { ok, err, preflight, body }         = require('./_response');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'PATCH') return err('Method not allowed', 405);

  let caller;
  try { caller = requireAuth(event); }
  catch { return err('Unauthorised', 401); }

  const { currentPassword, newPassword } = body(event);

  if (!currentPassword || !newPassword) return err('currentPassword and newPassword are required');
  if (newPassword.length < 6) return err('New password must be at least 6 characters');

  try {
    const [user] = await sql`SELECT id, password_hash FROM users WHERE id = ${caller.userId}`;
    if (!user) return err('User not found', 404);

    const valid = verifyPassword(currentPassword, user.password_hash);
    if (!valid) return err('Current password is incorrect', 401);

    const newHash = hashPassword(newPassword);
    await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${caller.userId}`;

    return ok({ message: 'Password updated successfully' });
  } catch (e) {
    console.error('users error', e);
    return err(e.message || 'Internal server error', 500);
  }
};
