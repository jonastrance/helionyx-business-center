import { Router } from 'express';
import { pool } from '../db.js';

const r = Router();

// Input sanitization - trim strings and limit length
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.trim().slice(0, 1000);
}

function sanitizeNumber(num) {
  if (typeof num !== 'number') return null;
  return Math.min(Math.max(num, 0), 999999999);
}

// Validate envelope data
function validateEnvelope(data) {
  const errors = [];
  if (!data.name || !data.name.trim()) {
    errors.push('Name is required');
  }
  if (data.name && data.name.length > 200) {
    errors.push('Name must be under 200 characters');
  }
  if (data.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.client_email)) {
    errors.push('Invalid email format');
  }
  if (data.monthly_cost && isNaN(parseFloat(data.monthly_cost))) {
    errors.push('Monthly cost must be a number');
  }
  return errors;
}

r.get('/', async (req, res) => {
  if (!pool) return res.json([]);
  try {
    const { rows } = await pool.query('SELECT * FROM envelopes ORDER BY updated_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.get('/:id', async (req, res) => {
  if (!pool) return res.json({});
  try {
    const { rows } = await pool.query('SELECT * FROM envelopes WHERE id=$1', [req.params.id]);
    res.json(rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/', async (req, res) => {
  const {
    name, type = 'generic', client_name, client_email, company,
    domain, server_ip, server_url, whm_username, cpanel_username,
    registrar, registrar_account, nameservers, ssl_valid_to,
    ssl_issuer, billing_cycle, monthly_cost, notes, custom_fields
  } = req.body;

  // Validate before processing
  const errors = validateEnvelope({ name, client_email, monthly_cost });
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  // Sanitize all string inputs
  const sanitized = {
    name: sanitize(name),
    type: sanitize(type) || 'generic',
    client_name: sanitize(client_name),
    client_email: sanitize(client_email),
    company: sanitize(company),
    domain: sanitize(domain),
    server_ip: sanitize(server_ip),
    server_url: sanitize(server_url),
    whm_username: sanitize(whm_username),
    cpanel_username: sanitize(cpanel_username),
    registrar: sanitize(registrar),
    registrar_account: sanitize(registrar_account),
    ssl_valid_to: ssl_valid_to || null,
    ssl_issuer: sanitize(ssl_issuer),
    billing_cycle: sanitize(billing_cycle),
    monthly_cost: sanitizeNumber(parseFloat(monthly_cost)),
    notes: sanitize(notes),
    custom_fields: typeof custom_fields === 'object' ? custom_fields : {},
  };

  if (!pool) {
    return res.json({ id: Date.now(), ...sanitized, created_at: new Date().toISOString() });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO envelopes (name, type, client_name, client_email, company, domain, server_ip, server_url,
        whm_username, cpanel_username, registrar, registrar_account, nameservers, ssl_valid_to, ssl_issuer,
        billing_cycle, monthly_cost, notes, custom_fields)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [sanitized.name, sanitized.type, sanitized.client_name, sanitized.client_email, sanitized.company,
       sanitized.domain, sanitized.server_ip, sanitized.server_url, sanitized.whm_username, sanitized.cpanel_username,
       sanitized.registrar, sanitized.registrar_account, nameservers, sanitized.ssl_valid_to, sanitized.ssl_issuer,
       sanitized.billing_cycle, sanitized.monthly_cost, sanitized.notes, JSON.stringify(sanitized.custom_fields)]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.put('/:id', async (req, res) => {
  const {
    name, type, client_name, client_email, company,
    domain, server_ip, server_url, whm_username, cpanel_username,
    registrar, registrar_account, nameservers, ssl_valid_to,
    ssl_issuer, billing_cycle, monthly_cost, notes, custom_fields
  } = req.body;

  // Validate
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }

  const sanitized = {
    name: sanitize(name),
    type: sanitize(type),
    client_name: sanitize(client_name),
    client_email: sanitize(client_email),
    company: sanitize(company),
    domain: sanitize(domain),
    server_ip: sanitize(server_ip),
    server_url: sanitize(server_url),
    whm_username: sanitize(whm_username),
    cpanel_username: sanitize(cpanel_username),
    registrar: sanitize(registrar),
    registrar_account: sanitize(registrar_account),
    ssl_valid_to: ssl_valid_to,
    ssl_issuer: sanitize(ssl_issuer),
    billing_cycle: sanitize(billing_cycle),
    monthly_cost: sanitizeNumber(parseFloat(monthly_cost)),
    notes: sanitize(notes),
    custom_fields: typeof custom_fields === 'object' ? custom_fields : null,
  };

  if (!pool) return res.json({ ok: true });

  try {
    const { rows } = await pool.query(
      `UPDATE envelopes SET
        name=COALESCE($1,name), type=COALESCE($2,type), client_name=COALESCE($3,client_name),
        client_email=COALESCE($4,client_email), company=COALESCE($5,company), domain=COALESCE($6,domain),
        server_ip=COALESCE($7,server_ip), server_url=COALESCE($8,server_url),
        whm_username=COALESCE($9,whm_username), cpanel_username=COALESCE($10,cpanel_username),
        registrar=COALESCE($11,registrar), registrar_account=COALESCE($12,registrar_account),
        ssl_valid_to=COALESCE($13,ssl_valid_to), ssl_issuer=COALESCE($14,ssl_issuer),
        billing_cycle=COALESCE($15,billing_cycle), monthly_cost=COALESCE($16,monthly_cost),
        notes=COALESCE($17,notes), custom_fields=COALESCE($18,custom_fields),
        updated_at=NOW() WHERE id=$19 RETURNING *`,
      [sanitized.name, sanitized.type, sanitized.client_name, sanitized.client_email, sanitized.company,
       sanitized.domain, sanitized.server_ip, sanitized.server_url, sanitized.whm_username, sanitized.cpanel_username,
       sanitized.registrar, sanitized.registrar_account, sanitized.ssl_valid_to, sanitized.ssl_issuer,
       sanitized.billing_cycle, sanitized.monthly_cost, sanitized.notes, sanitized.custom_fields ? JSON.stringify(sanitized.custom_fields) : null,
       req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.delete('/:id', async (req, res) => {
  if (!pool) return res.json({ ok: true });
  try {
    await pool.query('DELETE FROM envelopes WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default r;
