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
    const ownerCheck = await query('SELECT owner_id, title, description, price, item_type_id, elite, element, created_at FROM items WHERE id = $1', [req.params.id]);
    if (!ownerCheck.rowCount) return res.status(404).json({ error: 'Not found' });
    
    // Allow deletion if user is owner OR admin
    const isOwner = String(ownerCheck.rows[0].owner_id) === String(req.user.id);
    const isAdmin = req.user.isAdmin === true;
    
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
    
    const item = ownerCheck.rows[0];
    
    // Record item in items_sold table before deleting
    await query(
      'INSERT INTO items_sold (original_item_id, owner_id, title, description, price, item_type_id, elite, element, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [req.params.id, item.owner_id, item.title, item.description, item.price, item.item_type_id, item.elite, item.element, item.created_at]
    );
    
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

export default router;
