import express from 'express';
import { query } from './db.js';
import { requireAuth } from './middleware.auth.js';
import { invalidateStatsCache } from './cache.js';

const router = express.Router();

// Pagination constants for performance
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

router.get('/', async (req, res) => {
  const { q, ownerId, limit } = req.query;
  
  // Parse and enforce limit
  const requestedLimit = limit ? parseInt(limit, 10) : DEFAULT_LIMIT;
  const effectiveLimit = Math.min(Math.max(1, requestedLimit), MAX_LIMIT);
  
  let sql = 'SELECT i.id, i.title, i.description, i.price, i.image_url, i.item_type_id, i.elite, i.element, i.created_at, i.owner_id, u.display_name as owner_name FROM items i JOIN users u ON u.id = i.owner_id';
  const params = [];
  const clauses = [];
  if (q) {
    params.push(`%${q}%`);
    clauses.push(`(i.title ILIKE $${params.length} OR i.description ILIKE $${params.length})`);
  }
  if (ownerId) {
    params.push(ownerId);
    clauses.push(`i.owner_id = $${params.length}`);
  }
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  params.push(effectiveLimit);
  sql += ` ORDER BY i.created_at DESC LIMIT $${params.length}`;
  try {
    const r = await query(sql, params);
    // Include pagination info in response headers
    res.setHeader('X-Pagination-Limit', effectiveLimit);
    res.setHeader('X-Pagination-Count', r.rows.length);
    return res.json(r.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await query('SELECT id, owner_id, title, description, price, image_url, item_type_id, elite, element, created_at FROM items WHERE id = $1', [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
    return res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { title, description, price, imageUrl, itemTypeId, elite, element } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const r = await query(
      'INSERT INTO items (owner_id, title, description, price, image_url, item_type_id, elite, element) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
      [req.user.id, title, description || null, price ?? null, imageUrl || null, itemTypeId || null, elite ?? false, element || null]
    );
    
    // Invalidate stats cache since active listings count changed
    invalidateStatsCache();
    
    return res.status(201).json({ id: r.rows[0].id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { title, description, price, imageUrl, itemTypeId, elite, element } = req.body || {};
  try {
    const ownerCheck = await query('SELECT owner_id FROM items WHERE id = $1', [req.params.id]);
    if (!ownerCheck.rowCount) return res.status(404).json({ error: 'Not found' });
    
    // Allow editing if user is owner OR admin
    const isOwner = String(ownerCheck.rows[0].owner_id) === String(req.user.id);
    const isAdmin = req.user.isAdmin === true;
    
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
    
    await query(
      'UPDATE items SET title = COALESCE($2, title), description = COALESCE($3, description), price = COALESCE($4, price), image_url = COALESCE($5, image_url), item_type_id = COALESCE($6, item_type_id), elite = COALESCE($7, elite), element = COALESCE($8, element), updated_at = NOW() WHERE id = $1',
      [req.params.id, title ?? null, description ?? null, price ?? null, imageUrl ?? null, itemTypeId ?? null, elite ?? null, element ?? null]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { reason } = req.body || {};
    const ownerCheck = await query('SELECT owner_id, title, description, price, item_type_id, elite, element, created_at FROM items WHERE id = $1', [req.params.id]);
    if (!ownerCheck.rowCount) return res.status(404).json({ error: 'Not found' });
    
    // Allow deletion if user is owner OR admin OR mod
    const isOwner = String(ownerCheck.rows[0].owner_id) === String(req.user.id);
    const isAdmin = req.user.isAdmin === true;
    const isMod = req.user.isMod === true;
    
    if (!isOwner && !isAdmin && !isMod) return res.status(403).json({ error: 'Forbidden' });
    
    // Mods must provide reason when deleting other's items
    if ((isAdmin || isMod) && !isOwner && !reason) {
      return res.status(400).json({ error: 'Reason required for moderator deletion' });
    }
    
    const item = ownerCheck.rows[0];
    
    // Record item in items_sold table before deleting
    await query(
      'INSERT INTO items_sold (original_item_id, owner_id, title, description, price, item_type_id, elite, element, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [req.params.id, item.owner_id, item.title, item.description, item.price, item.item_type_id, item.elite, item.element, item.created_at]
    );
    
    // Send notification if mod/admin deleted someone else's item
    if ((isAdmin || isMod) && !isOwner && reason) {
      const modInfo = await query('SELECT display_name FROM users WHERE id = $1', [req.user.id]);
      const modName = modInfo.rows[0]?.display_name || 'Moderator';
      
      await query(
        'INSERT INTO user_notifications (user_id, type, item_id, item_title, item_description, reason, moderator_name) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [item.owner_id, 'item_deleted', req.params.id, item.title, item.description, reason, modName]
      );
    }
    
    await query('DELETE FROM items WHERE id = $1', [req.params.id]);
    
    // Invalidate stats cache since both active listings and sold items changed
    invalidateStatsCache();
    
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get items sold history for current user or specific user (admin/mod only for other users)
router.get('/sold/history', requireAuth, async (req, res) => {
  try {
    const { userId } = req.query;
    let targetUserId = req.user.id;
    
    // If requesting another user's history, check permissions
    if (userId && userId !== req.user.id) {
      if (!req.user.isAdmin && !req.user.isMod) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      targetUserId = userId;
    }
    
    const r = await query(
      'SELECT id, original_item_id, title, description, price, item_type_id, elite, element, created_at, deleted_at FROM items_sold WHERE owner_id = $1 ORDER BY deleted_at DESC, created_at DESC',
      [targetUserId]
    );
    
    return res.json(r.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add warning to item (admin/mod only)
router.post('/:id/warnings', requireAuth, async (req, res) => {
  try {
    const { reason } = req.body || {};
    if (!reason) return res.status(400).json({ error: 'Reason required' });
    
    // Check permissions
    if (!req.user.isAdmin && !req.user.isMod) {
      return res.status(403).json({ error: 'Admin or Moderator access required' });
    }
    
    // Verify item exists and get owner
    const itemCheck = await query('SELECT owner_id, title FROM items WHERE id = $1', [req.params.id]);
    if (!itemCheck.rowCount) return res.status(404).json({ error: 'Item not found' });
    
    const item = itemCheck.rows[0];
    
    // Create warning
    const r = await query(
      'INSERT INTO item_warnings (item_id, moderator_id, reason) VALUES ($1, $2, $3) RETURNING id, created_at',
      [req.params.id, req.user.id, reason]
    );
    
    // Send notification to item owner
    const modInfo = await query('SELECT display_name FROM users WHERE id = $1', [req.user.id]);
    const modName = modInfo.rows[0]?.display_name || 'Moderator';
    
    await query(
      'INSERT INTO user_notifications (user_id, type, item_id, item_title, item_description, reason, moderator_name) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [item.owner_id, 'item_warned', req.params.id, item.title, item.description, reason, modName]
    );
    
    return res.status(201).json({ id: r.rows[0].id, created_at: r.rows[0].created_at });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get warnings for an item
router.get('/:id/warnings', async (req, res) => {
  try {
    const r = await query(
      'SELECT w.id, w.reason, w.created_at, u.display_name as moderator_name FROM item_warnings w JOIN users u ON u.id = w.moderator_id WHERE w.item_id = $1 ORDER BY w.created_at DESC',
      [req.params.id]
    );
    return res.json(r.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get user's notifications
router.get('/notifications/me', requireAuth, async (req, res) => {
  try {
    const r = await query(
      'SELECT id, type, item_id, item_title, item_description, reason, moderator_name, is_read, created_at FROM user_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    return res.json(r.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Mark notifications as read
router.put('/notifications/read', requireAuth, async (req, res) => {
  try {
    const { ids } = req.body || {};
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });
    
    await query(
      'UPDATE user_notifications SET is_read = true WHERE user_id = $1 AND id = ANY($2)',
      [req.user.id, ids]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get moderation history (admin/mod only) - returns all mod actions from notifications
router.get('/mod-history', requireAuth, async (req, res) => {
  try {
    const isAdmin = req.user.isAdmin;
    const isMod = req.user.isMod;
    
    if (!isAdmin && !isMod) {
      return res.status(403).json({ error: 'Forbidden - Admin or Mod access required' });
    }
    
    // Fetch all notifications (deletions and warnings) to show mod actions
    const r = await query(
      `SELECT 
        type, 
        item_id, 
        item_title, 
        item_description,
        reason, 
        moderator_name, 
        created_at,
        (SELECT display_name FROM users WHERE id = user_id) as target_user
      FROM user_notifications 
      WHERE type IN ('item_deleted', 'item_warned')
      ORDER BY created_at DESC 
      LIMIT 100`,
      []
    );
    
    return res.json(r.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;

