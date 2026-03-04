import { Router } from 'express';
import { pool } from '../db.js';

const r = Router();

r.get('/', async (req, res) => {
  if (!pool) return res.json({});
  try {
    const { rows } = await pool.query('SELECT * FROM setup_items');
    const map = {};
    rows.forEach(row => { map[row.id] = { done: row.done, notes: row.notes }; });
    res.json(map);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.put('/:id', async (req, res) => {
  const { done, notes } = req.body;
  if (!pool) return res.json({ ok: true });
  try {
    await pool.query(
      `INSERT INTO setup_items (id, done, notes, updated_at) VALUES ($1,$2,$3,NOW())
       ON CONFLICT (id) DO UPDATE SET done=$2, notes=COALESCE($3, setup_items.notes), updated_at=NOW()`,
      [req.params.id, done, notes]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default r;
