import { Router } from 'express';

const r = Router();

// Get all settings
r.get('/', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    const { rows } = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    rows.forEach(row => { settings[row.key] = row.value; });
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get a single setting
r.get('/:key', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    const { rows } = await pool.query('SELECT value FROM settings WHERE key = $1', [req.params.key]);
    if (rows.length === 0) return res.json({ value: null });
    res.json({ value: rows[0].value });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Set a setting
r.put('/:key', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    const { value } = req.body;
    await pool.query(
      'INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
      [req.params.key, value]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get API provider status
r.get('/providers/status', (req, res) => {
  res.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    minimax: !!process.env.MINIMAX_API_KEY,
    whmcs: !!(process.env.WHMCS_IDENTIFIER && process.env.WHMCS_SECRET),
    whm: !!process.env.WHM_TOKEN,
  });
});

export default r;
