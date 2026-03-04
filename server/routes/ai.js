import { Router } from 'express';

const r = Router();

// Anthropic — streaming SSE
r.post('/anthropic', async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(400).json({ error: 'ANTHROPIC_API_KEY not configured in .env' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'messages-2023-06-01',
      },
      body: JSON.stringify({ ...req.body, stream: false }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// OpenAI
r.post('/openai', async (req, res) => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(400).json({ error: 'OPENAI_API_KEY not configured in .env' });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// MiniMax
r.post('/minimax', async (req, res) => {
  const key = process.env.MINIMAX_API_KEY;
  if (!key) return res.status(400).json({ error: 'MINIMAX_API_KEY not configured in .env' });

  try {
    const response = await fetch('https://api.minimax.io/v1/text/chatcompletion_pro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Providers availability (never expose keys)
r.get('/providers', (req, res) => {
  res.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    minimax: !!process.env.MINIMAX_API_KEY,
  });
});

export default r;
