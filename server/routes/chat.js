import { Router } from 'express';
import { pool } from '../db.js';

const r = Router();

r.get('/', async (req, res) => {
  if (!pool) return res.json([]);
  try {
    const { rows } = await pool.query(
      'SELECT * FROM chat_messages ORDER BY created_at ASC LIMIT 200'
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/', async (req, res) => {
  const { provider = 'ollama', role, content } = req.body;
  if (!pool) return res.json({ ok: true });
  try {
    await pool.query(
      'INSERT INTO chat_messages (provider, role, content) VALUES ($1,$2,$3)',
      [provider, role, content]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.delete('/', async (req, res) => {
  if (!pool) return res.json({ ok: true });
  try {
    await pool.query('DELETE FROM chat_messages');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default r;
