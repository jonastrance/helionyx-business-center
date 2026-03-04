import { Router } from 'express';

const r = Router();

// Check SSL certificate for a domain
async function checkSSL(domain) {
  const https = await import('https');

  return new Promise((resolve) => {
    const req = https.get(`https://${domain}`, { servername: domain, timeout: 10000 }, (res) => {
      const cert = res.socket.getPeerCertificate();
      if (!cert || Object.keys(cert).length === 0) {
        resolve({ status: 'error', error: 'No certificate found' });
        return;
      }

      const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
      const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
      const now = new Date();

      let status = 'valid';
      if (validTo) {
        const daysUntilExpiry = Math.ceil((validTo - now) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0) status = 'expired';
        else if (daysUntilExpiry < 30) status = 'expiring';
      }

      resolve({
        domain,
        issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown',
        valid_from: validFrom?.toISOString().split('T')[0],
        valid_to: validTo?.toISOString().split('T')[0],
        status,
        error: null,
      });
    });

    req.on('error', (e) => {
      resolve({ domain, status: 'error', error: e.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ domain, status: 'error', error: 'Connection timeout' });
    });
  });
}

// Get all tracked SSL certs
r.get('/certs', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    const { rows } = await pool.query('SELECT * FROM ssl_certs ORDER BY valid_to ASC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add a domain to track
r.post('/certs', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain required' });

    // Check SSL
    const result = await checkSSL(domain);

    // Save to database
    await pool.query(
      `INSERT INTO ssl_certs (domain, issuer, valid_from, valid_to, status, error, last_checked)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (domain) DO UPDATE SET
         issuer = $2, valid_from = $3, valid_to = $4, status = $5, error = $6, last_checked = NOW()`,
      [domain, result.issuer, result.valid_from, result.valid_to, result.status, result.error]
    );

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Check SSL for a domain
r.post('/check/:domain', async (req, res) => {
  try {
    const domain = req.params.domain;
    const result = await checkSSL(domain);

    // Update in database
    const { pool } = await import('../db.js');
    await pool.query(
      `INSERT INTO ssl_certs (domain, issuer, valid_from, valid_to, status, error, last_checked)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (domain) DO UPDATE SET
         issuer = $2, valid_from = $3, valid_to = $4, status = $5, error = $6, last_checked = NOW()`,
      [domain, result.issuer, result.valid_from, result.valid_to, result.status, result.error]
    );

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete a tracked cert
r.delete('/certs/:id', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    await pool.query('DELETE FROM ssl_certs WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default r;
