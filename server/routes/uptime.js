import { Router } from 'express';

const r = Router();

const DEFAULT_TARGET = 'helionyxcommons.com';

// Check uptime for a target
async function checkUptime(target) {
  const start = Date.now();

  try {
    const response = await fetch(`https://${target}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    });
    const responseTime = Date.now() - start;
    return {
      target,
      status: response.ok ? response.status : response.status,
      response_ms: responseTime,
      success: response.ok,
    };
  } catch (e) {
    const responseTime = Date.now() - start;
    return {
      target,
      status: 0,
      response_ms: responseTime,
      success: false,
      error: e.message,
    };
  }
}

// Get uptime logs
r.get('/logs', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    const { rows } = await pool.query(
      'SELECT * FROM uptime_logs WHERE target = $1 ORDER BY checked_at DESC LIMIT 1440',
      [DEFAULT_TARGET]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get uptime stats
r.get('/stats', async (req, res) => {
  try {
    const { pool } = await import('../db.js');

    // Get last 24 hours (1440 minutes)
    const { rows } = await pool.query(
      `SELECT * FROM uptime_logs
       WHERE target = $1 AND checked_at > NOW() - INTERVAL '24 hours'
       ORDER BY checked_at DESC`,
      [DEFAULT_TARGET]
    );

    if (rows.length === 0) {
      return res.json({ uptime: 0, avgResponse: 0, total: 0, success: 0 });
    }

    const success = rows.filter(r => r.status >= 200 && r.status < 400).length;
    const total = rows.length;
    const uptime = total > 0 ? Math.round((success / total) * 10000) / 100 : 0;
    const avgResponse = total > 0
      ? Math.round(rows.reduce((sum, r) => sum + (r.response_ms || 0), 0) / total)
      : 0;

    res.json({ uptime, avgResponse, total, success });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Trigger a check
r.post('/check', async (req, res) => {
  try {
    const target = req.body.target || DEFAULT_TARGET;
    const result = await checkUptime(target);

    // Save to database
    const { pool } = await import('../db.js');
    await pool.query(
      'INSERT INTO uptime_logs (target, status, response_ms) VALUES ($1, $2, $3)',
      [target, result.status, result.response_ms]
    );

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get latest check
r.get('/latest', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    const { rows } = await pool.query(
      'SELECT * FROM uptime_logs WHERE target = $1 ORDER BY checked_at DESC LIMIT 1',
      [DEFAULT_TARGET]
    );
    res.json(rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default r;
