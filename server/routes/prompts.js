import { Router } from 'express';
import { pool } from '../db.js';

const r = Router();

// Input sanitization
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.trim().slice(0, 5000);
}

function sanitizeArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(sanitize).filter(Boolean).slice(0, 20);
}

r.get('/', async (req, res) => {
  if (!pool) return res.json([]);
  try {
    const { rows } = await pool.query('SELECT * FROM prompts ORDER BY updated_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.get('/:id', async (req, res) => {
  if (!pool) return res.json({});
  try {
    const { rows } = await pool.query('SELECT * FROM prompts WHERE id=$1', [req.params.id]);
    res.json(rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/', async (req, res) => {
  const { title, content, category = 'general', tags = [] } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });

  const sanitized = {
    title: sanitize(title),
    content: sanitize(content),
    category: sanitize(category) || 'general',
    tags: sanitizeArray(tags),
  };

  if (!pool) {
    return res.json({ id: Date.now(), ...sanitized, use_count: 0, created_at: new Date().toISOString() });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO prompts (title, content, category, tags) VALUES ($1, $2, $3, $4) RETURNING *',
      [sanitized.title, sanitized.content, sanitized.category, sanitized.tags]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.put('/:id', async (req, res) => {
  const { title, content, category, tags } = req.body;

  const sanitized = {
    title: sanitize(title),
    content: sanitize(content),
    category: sanitize(category),
    tags: tags ? sanitizeArray(tags) : null,
  };

  if (!pool) return res.json({ ok: true });

  try {
    const { rows } = await pool.query(
      `UPDATE prompts SET
        title=COALESCE($1,title), content=COALESCE($2,content),
        category=COALESCE($3,category), tags=COALESCE($4,tags),
        updated_at=NOW() WHERE id=$5 RETURNING *`,
      [sanitized.title, sanitized.content, sanitized.category, sanitized.tags, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Increment use count when prompt is used
r.post('/:id/use', async (req, res) => {
  if (!pool) return res.json({ ok: true });
  try {
    const { rows } = await pool.query(
      'UPDATE prompts SET use_count = use_count + 1, last_used = NOW() WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.delete('/:id', async (req, res) => {
  if (!pool) return res.json({ ok: true });
  try {
    await pool.query('DELETE FROM prompts WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default r;
