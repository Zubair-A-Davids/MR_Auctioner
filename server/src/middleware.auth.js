import jwt from 'jsonwebtoken';
import { query } from './db.js';

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch user's admin status from database
    const userResult = await query('SELECT id, is_admin, is_mod FROM users WHERE id = $1', [payload.sub]);
    if (!userResult.rowCount) {
      return res.status(401).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];
    req.user = { 
      id: user.id,
      isAdmin: user.is_admin,
      isMod: user.is_mod
    };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
