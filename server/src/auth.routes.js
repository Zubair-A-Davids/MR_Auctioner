import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db.js';
import { requireAuth } from './middleware.auth.js';
import { getStatsCache, setStatsCache } from './cache.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, displayName, bio, avatar, discord } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    // Check if IP is banned
    const userIp = req.ip;
    const banned = await query('SELECT id, reason FROM banned_ips WHERE ip_address = $1', [userIp]);
    if (banned.rowCount) {
      return res.status(403).json({ error: `Registration blocked for this IP. Reason: ${banned.rows[0].reason || 'Banned'}` });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rowCount) return res.status(409).json({ error: 'Email already in use' });

    // Basic avatar size guard (base64 length) ~ <= 90KB
    if (avatar && avatar.length > 120000) {
      return res.status(413).json({ error: 'Avatar too large' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password_hash, display_name, discord, bio, avatar) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [email.toLowerCase(), password_hash, displayName || null, discord || null, bio || null, avatar || null]
    );
    const userId = result.rows[0].id;
    const token = jwt.sign({}, process.env.JWT_SECRET, { subject: String(userId), expiresIn: '7d' });
    
    // Track the user's IP address
    const userIp2 = req.ip;
    const userAgent = req.get('user-agent');
    await query('SELECT update_user_ip($1, $2, $3)', [userId, userIp2, userAgent]);
    
    return res.status(201).json({ token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    // Check if IP is banned
    const loginIp = req.ip;
    const banned = await query('SELECT id, reason FROM banned_ips WHERE ip_address = $1', [loginIp]);
    if (banned.rowCount) {
      return res.status(403).json({ error: `Login blocked for this IP. Reason: ${banned.rows[0].reason || 'Banned'}` });
    }

    const ures = await query('SELECT id, password_hash, banned_until, banned_reason FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!ures.rowCount) return res.status(401).json({ error: 'Invalid credentials' });
    const user = ures.rows[0];
    
    // Check if user is banned
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      const remainingMin = Math.ceil((new Date(user.banned_until) - new Date()) / 60000);
      const reason = user.banned_reason ? ` Reason: ${user.banned_reason}` : '';
      return res.status(403).json({ error: `Account banned. ${remainingMin} minutes remaining.${reason}` });
    }
    
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Track the user's IP 
    const loginIp2 = req.ip;
    const userAgent = req.get('User-Agent');
    try {
      await query('SELECT update_user_ip($1, $2, $3)', [user.id, loginIp2, userAgent]);
    } catch (e) {
      console.error('Error updating user IP:', e);
    }
    
    const token = jwt.sign({}, process.env.JWT_SECRET, { subject: String(user.id), expiresIn: '7d' });
    return res.json({ token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
// Admin: View all banned IPs
router.get('/banned-ips', requireAuth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
  try {
    const r = await query('SELECT id, ip_address, reason, banned_by, created_at FROM banned_ips ORDER BY created_at DESC', []);
    return res.json(r.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Ban an IP address
router.post('/ban-ip', requireAuth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
  const { ip, reason } = req.body || {};
  if (!ip) return res.status(400).json({ error: 'IP address required' });
  try {
    await query('INSERT INTO banned_ips (ip_address, reason, banned_by) VALUES ($1, $2, $3) ON CONFLICT (ip_address) DO UPDATE SET reason = $2, banned_by = $3, created_at = NOW()', [ip, reason || '', req.user.id]);
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    // Update last_seen timestamp
    await query('UPDATE users SET last_seen = NOW() WHERE id = $1', [req.user.id]);
    
    const ures = await query('SELECT id, email, display_name, discord, bio, avatar, is_admin, is_mod, last_seen, banned_until, banned_reason FROM users WHERE id = $1', [req.user.id]);
    if (!ures.rowCount) return res.status(404).json({ error: 'Not found' });
    const user = ures.rows[0];
    
    // Check if user is banned
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      const remainingMin = Math.ceil((new Date(user.banned_until) - new Date()) / 60000);
      const reason = user.banned_reason ? ` Reason: ${user.banned_reason}` : '';
      return res.status(403).json({ error: `Account banned. ${remainingMin} minutes remaining.${reason}` });
    }
    
    return res.json({ 
      id: user.id, 
      email: user.email, 
      displayName: user.display_name,
      discord: user.discord,
      bio: user.bio,
      avatar: user.avatar,
      isAdmin: user.is_admin,
      isMod: user.is_mod,
      lastSeen: user.last_seen
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get public user profile by ID (no auth required)
router.get('/users/:userId/profile', async (req, res) => {
  try {
    const ures = await query('SELECT id, display_name, discord, bio, avatar, last_seen FROM users WHERE id = $1', [req.params.userId]);
    if (!ures.rowCount) return res.status(404).json({ error: 'User not found' });
    const user = ures.rows[0];
    return res.json({ 
      id: user.id,
      displayName: user.display_name,
      discord: user.discord,
      bio: user.bio,
      avatar: user.avatar,
      lastSeen: user.last_seen
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile by email (for backward compatibility with localStorage mode)
router.get('/users/by-email/:email/profile', async (req, res) => {
  try {
    const ures = await query('SELECT id, display_name, discord, bio, avatar, last_seen FROM users WHERE email = $1', [req.params.email]);
    if (!ures.rowCount) return res.status(404).json({ error: 'User not found' });
    const user = ures.rows[0];
    return res.json({ 
      id: user.id,
      displayName: user.display_name,
      discord: user.discord,
      bio: user.bio,
      avatar: user.avatar,
      lastSeen: user.last_seen
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/profile', requireAuth, async (req, res) => {
  const { displayName, discord, bio, avatar } = req.body || {};
  console.log('Profile update request:', { userId: req.user.id, displayName, discord, bio, avatarLength: avatar ? avatar.length : 0 });
  try {
    const result = await query(
      'UPDATE users SET display_name = $1, discord = $2, bio = $3, avatar = $4 WHERE id = $5',
      [displayName || null, discord || null, bio || null, avatar || null, req.user.id]
    );
    console.log('Profile update result:', { rowCount: result.rowCount, userId: req.user.id });
    return res.json({ success: true });
  } catch (e) {
    console.error('Profile update error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'New password too short' });
  }
  try {
    const ures = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!ures.rowCount) return res.status(404).json({ error: 'User not found' });
    const user = ures.rows[0];
    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Current password incorrect' });
    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (admin and mod access)
// Get all users with their IP addresses (admin only)
router.get('/users-with-ips', requireAuth, async (req, res) => {
  try {
    // Check if requester is admin
    const userCheck = await query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!userCheck.rowCount || !userCheck.rows[0].is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Get all users with their IP addresses
    const result = await query(`
      SELECT 
        u.id, u.email, u.display_name, u.is_admin, u.is_mod, u.banned_until,
        json_agg(DISTINCT ui.ip_address) as ip_addresses
      FROM users u
      LEFT JOIN user_ips ui ON u.id = ui.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    return res.json(result.rows.map(row => ({
      ...row,
      ip_addresses: row.ip_addresses.filter(ip => ip !== null)
    })));
  } catch (e) {
    console.error('Error fetching users with IPs:', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', requireAuth, async (req, res) => {
  try {
    // Check if requester is admin or mod
    const userCheck = await query('SELECT is_admin, is_mod FROM users WHERE id = $1', [req.user.id]);
    if (!userCheck.rowCount || (!userCheck.rows[0].is_admin && !userCheck.rows[0].is_mod)) {
      return res.status(403).json({ error: 'Admin or Moderator access required' });
    }
    
    const usersResult = await query(
      'SELECT id, email, display_name, is_admin, is_mod, banned_until, banned_reason, created_at FROM users ORDER BY email',
      []
    );
    
    return res.json(usersResult.rows.map(u => ({
      username: u.email,
      displayName: u.display_name,
      isAdmin: u.is_admin,
      isMod: u.is_mod,
      bannedUntil: u.banned_until,
      bannedReason: u.banned_reason,
      createdAt: u.created_at
    })));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:email', requireAuth, async (req, res) => {
  try {
    // Check if requester is admin
    const adminCheck = await query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!adminCheck.rowCount || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const email = req.params.email.toLowerCase();
    
    // Don't allow deleting admin users
    const targetUser = await query('SELECT is_admin FROM users WHERE email = $1', [email]);
    if (targetUser.rowCount && targetUser.rows[0].is_admin) {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }
    
    const result = await query('DELETE FROM users WHERE email = $1 RETURNING email', [email]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update user (admin only) - for ban, mod status, rename
router.put('/users/:email', requireAuth, async (req, res) => {
  try {
    // Check if requester is admin
    const adminCheck = await query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!adminCheck.rowCount || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const email = req.params.email.toLowerCase();
    const { bannedUntil, bannedReason, isMod, displayName } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (bannedUntil !== undefined) {
      updates.push(`banned_until = $${paramCount++}`);
      values.push(bannedUntil ? new Date(bannedUntil) : null);
    }
    if (bannedReason !== undefined) {
      updates.push(`banned_reason = $${paramCount++}`);
      values.push(bannedReason || null);
    }
    if (isMod !== undefined) {
      updates.push(`is_mod = $${paramCount++}`);
      values.push(isMod);
    }
    if (displayName !== undefined) {
      updates.push(`display_name = $${paramCount++}`);
      values.push(displayName);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    values.push(email);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE email = $${paramCount} RETURNING email`,
      values
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get site statistics (public endpoint)
router.get('/stats', async (req, res) => {
  try {
    // Check cache first
    const cached = getStatsCache();
    if (cached.hit) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Age', cached.age);
      return res.json(cached.data);
    }
    
    // Fetch fresh data
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const listingCount = await query('SELECT COUNT(*) as count FROM items');
    const soldCount = await query('SELECT COUNT(*) as count FROM items_sold');
    
    const result = {
      totalUsers: parseInt(userCount.rows[0].count),
      activeListings: parseInt(listingCount.rows[0].count),
      itemsSold: parseInt(soldCount.rows[0].count)
    };
    
    // Update cache
    setStatsCache(result);
    
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Browser cache for 5 minutes
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
