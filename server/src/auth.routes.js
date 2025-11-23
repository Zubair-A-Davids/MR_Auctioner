import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db.js';
import { requireAuth } from './middleware.auth.js';
import { getStatsCache, setStatsCache } from './cache.js';

// Helper: normalize raw IP values to a consistent form
function normalizeIp(raw) {
  if (!raw) return null;
  // If header contains multiple IPs, take the first
  let ip = Array.isArray(raw) ? raw[0] : String(raw);
  ip = ip.split(',')[0].trim();
  // Strip IPv4-mapped IPv6 prefix
  if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
  // Map IPv6 loopback to IPv4 loopback for readability in UI/local dev
  if (ip === '::1') ip = '127.0.0.1';
  return ip;
}

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, displayName, bio, avatar, discord } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rowCount) return res.status(409).json({ error: 'Email already in use' });

    // Basic avatar size guard (base64 length) ~ <= 90KB
    if (avatar && avatar.length > 120000) {
      return res.status(413).json({ error: 'Avatar too large' });
    }

    // Check if client IP is banned (best-effort)
    try{
      const clientIp = normalizeIp(req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress);
      if(clientIp){
        const bip = await query('SELECT ip, banned_until FROM banned_ips WHERE ip = $1', [clientIp]);
        if(bip.rowCount){
          const rec = bip.rows[0];
          if(!rec.banned_until || new Date(rec.banned_until) > new Date()){
            return res.status(403).json({ error: 'Registrations from this IP are banned' });
          }
        }
      }
    }catch(e){ /* ignore if table missing */ }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password_hash, display_name, discord, bio, avatar) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [email.toLowerCase(), password_hash, displayName || null, discord || null, bio || null, avatar || null]
    );
    const userId = result.rows[0].id;
    // Try to record last_ip if available (best-effort; migration may not have been run)
    try{
      const clientIp = normalizeIp(req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress);
      if(clientIp){
        await query('UPDATE users SET last_ip = $1 WHERE id = $2', [clientIp, userId]);
        try{
          await query('INSERT INTO user_ips (user_id, ip) VALUES ($1,$2) ON CONFLICT DO NOTHING', [userId, clientIp]);
        }catch(e){ /* ignore if user_ips missing */ }
      }
    }catch(e){ /* ignore if column missing */ }
    const token = jwt.sign({}, process.env.JWT_SECRET, { subject: String(userId), expiresIn: '7d' });
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
    const ures = await query('SELECT id, password_hash, banned_until, banned_reason FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!ures.rowCount) return res.status(401).json({ error: 'Invalid credentials' });
    const user = ures.rows[0];
    // Check if user is banned
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      const remainingMin = Math.ceil((new Date(user.banned_until) - new Date()) / 60000);
      const reason = user.banned_reason ? ` Reason: ${user.banned_reason}` : '';
      return res.status(403).json({ error: `Account banned. ${remainingMin} minutes remaining.${reason}` });
    }

    // Check if IP is banned (banned_ips table) - best-effort
    try{
      const clientIp = normalizeIp(req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress);
      if(clientIp){
        const bip = await query('SELECT ip, banned_until FROM banned_ips WHERE ip = $1', [clientIp]);
        if(bip.rowCount){
          const rec = bip.rows[0];
          if(!rec.banned_until || new Date(rec.banned_until) > new Date()){
            return res.status(403).json({ error: 'Access from this IP is banned' });
          }
        }
      }
    }catch(e){ /* ignore if table missing */ }
    
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Try to record last_ip on successful login (best-effort; migration may not have been run)
    try{
      const clientIp = normalizeIp(req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress);
      if(clientIp){
        await query('UPDATE users SET last_ip = $1 WHERE id = $2', [clientIp, user.id]);
        try{
          await query('INSERT INTO user_ips (user_id, ip) VALUES ($1,$2) ON CONFLICT DO NOTHING', [user.id, clientIp]);
        }catch(e){ /* ignore if user_ips missing */ }
      }
    }catch(e){ /* ignore if column missing */ }

    const token = jwt.sign({}, process.env.JWT_SECRET, { subject: String(user.id), expiresIn: '7d' });
    return res.json({ token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
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
router.get('/users', requireAuth, async (req, res) => {
  try {
    // Check if requester is admin or mod
    const userCheck = await query('SELECT is_admin, is_mod FROM users WHERE id = $1', [req.user.id]);
    if (!userCheck.rowCount || (!userCheck.rows[0].is_admin && !userCheck.rows[0].is_mod)) {
      return res.status(403).json({ error: 'Admin or Moderator access required' });
    }
    const viewerIsAdmin = !!userCheck.rows[0].is_admin;
    
    let usersResult;
    // Try selecting last_ip as well if column exists
    try{
      usersResult = await query(
        'SELECT id, email, display_name, is_admin, is_mod, banned_until, banned_reason, created_at, COALESCE(last_ip, NULL) as last_ip FROM users ORDER BY email',
        []
      );
    }catch(e){
      // Fallback to older schema without last_ip
      usersResult = await query(
        'SELECT id, email, display_name, is_admin, is_mod, banned_until, banned_reason, created_at FROM users ORDER BY email',
        []
      );
    }

    return res.json(usersResult.rows.map(u => ({
      username: u.email,
      displayName: u.display_name,
      isAdmin: u.is_admin,
      isMod: u.is_mod,
      bannedUntil: u.banned_until,
      bannedReason: u.banned_reason,
      createdAt: u.created_at,
      // Only include lastIp for viewers with admin privileges
      lastIp: viewerIsAdmin ? (u.last_ip || null) : null
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
    // Check requester roles (admin or mod)
    const viewerCheck = await query('SELECT is_admin, is_mod FROM users WHERE id = $1', [req.user.id]);
    if (!viewerCheck.rowCount || (!viewerCheck.rows[0].is_admin && !viewerCheck.rows[0].is_mod)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const viewerIsAdmin = !!viewerCheck.rows[0].is_admin;
    const viewerIsMod = !!viewerCheck.rows[0].is_mod;

    const email = req.params.email.toLowerCase();
    const { bannedUntil, bannedReason, isMod, displayName, bannedIp } = req.body;

    // If requester is a moderator (not admin), only allow banning actions
    if (!viewerIsAdmin && viewerIsMod) {
      // Fetch target roles to prevent mods banning admins or other mods
      const targetRes = await query('SELECT is_admin, is_mod FROM users WHERE email = $1', [email]);
      if (targetRes.rowCount && (targetRes.rows[0].is_admin || targetRes.rows[0].is_mod)) {
        return res.status(403).json({ error: 'Cannot modify admin or moderator accounts' });
      }
      // Mods may only set bannedUntil and bannedReason (and bannedIp via banned_ips table)
      if (isMod !== undefined || displayName !== undefined) {
        return res.status(403).json({ error: 'Insufficient permissions to update these fields' });
      }

      // Apply ban fields if provided
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
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No ban fields provided' });
      }
      values.push(email);
      const result = await query(`UPDATE users SET ${updates.join(', ')} WHERE email = $${paramCount} RETURNING email`, values);
      // Insert banned IP if provided
      try{
        // Determine the IP to ban: prefer explicit bannedIp; otherwise fall back to target's last_ip
        let ipToBan = null;
        if (bannedIp) ipToBan = normalizeIp(bannedIp);
        else {
          const targetIpRes = await query('SELECT last_ip FROM users WHERE email = $1', [email]);
          if (targetIpRes.rowCount) ipToBan = normalizeIp(targetIpRes.rows[0].last_ip);
        }

        if (ipToBan){
          await query('INSERT INTO banned_ips (ip, banned_until, reason) VALUES ($1,$2,$3) ON CONFLICT (ip) DO UPDATE SET banned_until = EXCLUDED.banned_until, reason = EXCLUDED.reason', [ipToBan, bannedUntil ? new Date(bannedUntil) : null, bannedReason || null]);
          // Also apply the same ban to other non-staff users that share this last_ip
          await query('UPDATE users SET banned_until = $1, banned_reason = $2 WHERE last_ip = $3 AND (is_admin = false AND is_mod = false)', [bannedUntil ? new Date(bannedUntil) : null, bannedReason || null, ipToBan]);
        }
      }catch(e){ /* ignore */ }
      if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
      return res.json({ success: true });
    }

    // Admin path: allow full updates
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
    const result = await query(`UPDATE users SET ${updates.join(', ')} WHERE email = $${paramCount} RETURNING email`, values);
    // If a bannedIp was provided, insert into banned_ips table (best-effort)
    try{
      // Determine IP to ban: explicit bannedIp preferred; otherwise use the target user's last_ip
      let ipToBan = null;
      if (bannedIp) ipToBan = normalizeIp(bannedIp);
      else {
        const targetIpRes = await query('SELECT last_ip FROM users WHERE email = $1', [email]);
        if (targetIpRes.rowCount) ipToBan = normalizeIp(targetIpRes.rows[0].last_ip);
      }

      if (ipToBan){
        await query('INSERT INTO banned_ips (ip, banned_until, reason) VALUES ($1,$2,$3) ON CONFLICT (ip) DO UPDATE SET banned_until = EXCLUDED.banned_until, reason = EXCLUDED.reason', [ipToBan, bannedUntil ? new Date(bannedUntil) : null, bannedReason || null]);
        // Also apply the same ban to other non-staff accounts sharing this IP
        await query('UPDATE users SET banned_until = $1, banned_reason = $2 WHERE last_ip = $3 AND (is_admin = false AND is_mod = false)', [bannedUntil ? new Date(bannedUntil) : null, bannedReason || null, ipToBan]);
      }
    }catch(e){ /* ignore if table missing */ }

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

// Get historical IPs for a user and accounts associated with those IPs
router.get('/users/by-email/:email/ips', requireAuth, async (req, res) => {
  try {
    // requester must be admin or mod
    const viewerCheck = await query('SELECT is_admin, is_mod FROM users WHERE id = $1', [req.user.id]);
    if (!viewerCheck.rowCount || (!viewerCheck.rows[0].is_admin && !viewerCheck.rows[0].is_mod)) {
      return res.status(403).json({ error: 'Admin or Moderator access required' });
    }

    const email = req.params.email;
    const targetRes = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (!targetRes.rowCount) return res.status(404).json({ error: 'User not found' });
    const targetId = targetRes.rows[0].id;

    // Fetch distinct IPs seen for this user from user_ips
    let ipRows;
    try{
      ipRows = await query('SELECT ip, max(seen_at) as seen_at FROM user_ips WHERE user_id = $1 GROUP BY ip ORDER BY max(seen_at) DESC', [targetId]);
    }catch(e){
      // If user_ips table missing, fall back to using last_ip from users
      const single = await query('SELECT last_ip FROM users WHERE id = $1', [targetId]);
      const ip = single.rowCount ? single.rows[0].last_ip : null;
      ipRows = { rows: ip ? [{ ip, seen_at: null }] : [] };
    }

    // For each IP, find associated accounts (either last_ip matches or historical entries)
    const result = [];
    for(const r of ipRows.rows){
      const ip = r.ip;
      if(!ip) continue;
      const accounts = [];
      // users with current last_ip = ip
      const cur = await query('SELECT id, email, last_ip, is_admin, is_mod, banned_until FROM users WHERE last_ip = $1', [ip]);
      cur.rows.forEach(u => accounts.push({ id: u.id, email: u.email, lastIp: u.last_ip, isAdmin: u.is_admin, isMod: u.is_mod, bannedUntil: u.banned_until }));
      // users with historical records of that ip (from user_ips) - include those not already in list
      try{
        const hist = await query('SELECT u.id, u.email, u.last_ip, u.is_admin, u.is_mod, u.banned_until FROM users u JOIN user_ips ui ON ui.user_id = u.id WHERE ui.ip = $1', [ip]);
        hist.rows.forEach(u => {
          if(!accounts.find(a => a.id === u.id)) accounts.push({ id: u.id, email: u.email, lastIp: u.last_ip, isAdmin: u.is_admin, isMod: u.is_mod, bannedUntil: u.banned_until });
        });
      }catch(e){ /* ignore if user_ips missing */ }

      result.push({ ip, seenAt: r.seen_at || null, accounts });
    }

    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
