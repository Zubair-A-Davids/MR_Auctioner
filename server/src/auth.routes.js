import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db.js';
import { requireAuth } from './middleware.auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rowCount) return res.status(409).json({ error: 'Email already in use' });
    // Determine display name (default to local-part of email if not provided)
    let desiredDisplay = (displayName || email.split('@')[0]).trim();
    if (!desiredDisplay) return res.status(400).json({ error: 'displayName required' });
    // Enforce uniqueness (case-insensitive)
    const dnExists = await query('SELECT 1 FROM users WHERE lower(display_name) = lower($1)', [desiredDisplay]);
    if (dnExists.rowCount) return res.status(409).json({ error: 'Display name already in use' });

    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id',
      [email.toLowerCase(), password_hash, desiredDisplay]
    );
    const userId = result.rows[0].id;
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
    const ures = await query('SELECT id, password_hash FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!ures.rowCount) return res.status(401).json({ error: 'Invalid credentials' });
    const user = ures.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({}, process.env.JWT_SECRET, { subject: String(user.id), expiresIn: '7d' });
    return res.json({ token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const ures = await query('SELECT id, email, display_name, discord, bio, avatar, is_admin, is_mod FROM users WHERE id = $1', [req.user.id]);
    if (!ures.rowCount) return res.status(404).json({ error: 'Not found' });
    const user = ures.rows[0];
    return res.json({ 
      id: user.id, 
      email: user.email, 
      displayName: user.display_name,
      discord: user.discord,
      bio: user.bio,
      avatar: user.avatar,
      isAdmin: user.is_admin,
      isMod: user.is_mod
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/profile', requireAuth, async (req, res) => {
  const { displayName, discord, bio, avatar } = req.body || {};
  try {
    if (displayName !== undefined && displayName !== null) {
      const desiredDisplay = String(displayName).trim();
      if (!desiredDisplay) return res.status(400).json({ error: 'displayName cannot be empty' });
      // Check uniqueness among other users
      const dnExists = await query('SELECT 1 FROM users WHERE lower(display_name) = lower($1) AND id <> $2', [desiredDisplay, req.user.id]);
      if (dnExists.rowCount) return res.status(409).json({ error: 'Display name already in use' });
    }
    await query(
      'UPDATE users SET display_name = COALESCE($1, display_name), discord = $2, bio = $3, avatar = $4 WHERE id = $5',
      [displayName !== undefined ? String(displayName).trim() : null, discord || null, bio || null, avatar || null, req.user.id]
    );
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
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

// Get all users (admin only)
router.get('/users', requireAuth, async (req, res) => {
  try {
    // Check if requester is admin
    const adminCheck = await query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!adminCheck.rowCount || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
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
      const desiredDisplay = String(displayName).trim();
      if (!desiredDisplay) return res.status(400).json({ error: 'displayName cannot be empty' });
      // Ensure uniqueness before updating
      const dnExists = await query('SELECT 1 FROM users WHERE lower(display_name) = lower($1) AND email <> $2', [desiredDisplay, email]);
      if (dnExists.rowCount) return res.status(409).json({ error: 'Display name already in use' });
      updates.push(`display_name = $${paramCount++}`);
      values.push(desiredDisplay);
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

export default router;
