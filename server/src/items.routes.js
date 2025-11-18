import express from 'express';
import { query } from './db.js';
import { requireAuth } from './middleware.auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { q, ownerId } = req.query;
  let sql = 'SELECT i.id, i.title, i.description, i.price, i.image_url, i.created_at, u.display_name as owner_name FROM items i JOIN users u ON u.id = i.owner_id';
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
  sql += ' ORDER BY i.created_at DESC LIMIT 100';
  try {
    const r = await query(sql, params);
    return res.json(r.rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await query('SELECT id, owner_id, title, description, price, image_url, created_at FROM items WHERE id = $1', [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
    return res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { title, description, price, imageUrl } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const r = await query(
      'INSERT INTO items (owner_id, title, description, price, image_url) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [req.user.id, title, description || null, price ?? null, imageUrl || null]
    );
    return res.status(201).json({ id: r.rows[0].id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { title, description, price, imageUrl } = req.body || {};
  try {
    const ownerCheck = await query('SELECT owner_id FROM items WHERE id = $1', [req.params.id]);
    if (!ownerCheck.rowCount) return res.status(404).json({ error: 'Not found' });
    
    // Allow editing if user is owner OR admin
    const isOwner = String(ownerCheck.rows[0].owner_id) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
    
    await query(
      'UPDATE items SET title = COALESCE($2, title), description = COALESCE($3, description), price = COALESCE($4, price), image_url = COALESCE($5, image_url), updated_at = NOW() WHERE id = $1',
      [req.params.id, title ?? null, description ?? null, price ?? null, imageUrl ?? null]
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const ownerCheck = await query('SELECT owner_id FROM items WHERE id = $1', [req.params.id]);
    if (!ownerCheck.rowCount) return res.status(404).json({ error: 'Not found' });
    
    // Allow deletion if user is owner OR admin
    const isOwner = String(ownerCheck.rows[0].owner_id) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Forbidden' });
    
    await query('DELETE FROM items WHERE id = $1', [req.params.id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
