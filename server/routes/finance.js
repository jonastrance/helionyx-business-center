import { Router } from 'express';

const r = Router();

// Get all transactions
r.get('/transactions', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    const { type, category, limit = 100 } = req.query;

    let query = 'SELECT * FROM transactions';
    const params = [];
    const conditions = [];

    if (type) {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC, created_at DESC';
    query += ` LIMIT $${params.length + 1}`;
    params.push(parseInt(limit, 10));

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add transaction
r.post('/transactions', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    const { type, amount, description, category, date, source } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ error: 'type and amount are required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO transactions (type, amount, description, category, date, source)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [type, amount, description, category, date || new Date().toISOString().split('T')[0], source]
    );

    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update transaction
r.put('/transactions/:id', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    const { type, amount, description, category, date, source } = req.body;

    const { rows } = await pool.query(
      `UPDATE transactions SET type = $1, amount = $2, description = $3, category = $4, date = $5, source = $6
       WHERE id = $7 RETURNING *`,
      [type, amount, description, category, date, source, req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete transaction
r.delete('/transactions/:id', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get MRR
r.get('/mrr', async (req, res) => {
  try {
    const { pool } = await import('../db.js');

    // Get current month's income
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE type = 'income' AND date >= $1 AND date <= $2`,
      [startOfMonth, endOfMonth]
    );

    const mrr = parseFloat(rows[0]?.total || 0);

    // Get last 3 months for trend
    const trendRows = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const s = d.toISOString().split('T')[0];
      const e = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      const { rows: r } = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE type = 'income' AND date >= $1 AND date <= $2`,
        [s, e]
      );
      trendRows.push({
        month: d.toLocaleString('default', { month: 'short' }),
        amount: parseFloat(r[0]?.total || 0),
      });
    }

    res.json({ mrr, trend: trendRows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get chart data (monthly P&L)
r.get('/chart', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    const months = 6;

    const data = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = d.toISOString().split('T')[0];
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];

      const { rows } = await pool.query(
        `SELECT type, COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE date >= $1 AND date <= $2 GROUP BY type`,
        [start, end]
      );

      const income = rows.find(r => r.type === 'income')?.total || 0;
      const expense = rows.find(r => r.type === 'expense')?.total || 0;

      data.push({
        month: d.toLocaleString('default', { month: 'short' }),
        income: parseFloat(income),
        expense: parseFloat(expense),
        profit: parseFloat(income) - parseFloat(expense),
      });
    }

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default r;
