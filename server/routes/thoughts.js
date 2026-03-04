import { Router } from 'express';
import { pool } from '../db.js';

const r = Router();

r.get('/', async (req, res) => {
  if (!pool) return res.json([]);
  try {
    const { rows } = await pool.query('SELECT * FROM thoughts ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/', async (req, res) => {
  const { content, tags = [] } = req.body;
  if (!content) return res.status(400).json({ error: 'content required' });
  if (!pool) return res.json({ id: Date.now(), content, tags, created_at: new Date().toISOString() });
  try {
    const { rows } = await pool.query(
      'INSERT INTO thoughts (content, tags) VALUES ($1, $2) RETURNING *',
      [content, tags]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.put('/:id', async (req, res) => {
  const { content, tags } = req.body;
  if (!pool) return res.json({ ok: true });
  try {
    const { rows } = await pool.query(
      'UPDATE thoughts SET content=COALESCE($1,content), tags=COALESCE($2,tags), updated_at=NOW() WHERE id=$3 RETURNING *',
      [content, tags, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.delete('/:id', async (req, res) => {
  if (!pool) return res.json({ ok: true });
  try {
    await pool.query('DELETE FROM thoughts WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default r;
