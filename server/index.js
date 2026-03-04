import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db.js';
import thoughtsRouter from './routes/thoughts.js';
import projectsRouter from './routes/projects.js';
import setupRouter from './routes/setup.js';
import aiRouter from './routes/ai.js';
import scannerRouter from './routes/scanner.js';
import chatRouter from './routes/chat.js';
import whmcsRouter from './routes/whmcs.js';
import financeRouter from './routes/finance.js';
import whmRouter from './routes/whm.js';
import uptimeRouter from './routes/uptime.js';
import sslRouter from './routes/ssl.js';
import settingsRouter from './routes/settings.js';
import gitRouter from './routes/git.js';
import envelopesRouter from './routes/envelopes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/thoughts', thoughtsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/setup', setupRouter);
app.use('/api/ai', aiRouter);
app.use('/api/scan', scannerRouter);
app.use('/api/chat', chatRouter);
app.use('/api/whmcs', whmcsRouter);
app.use('/api/finance', financeRouter);
app.use('/api/whm', whmRouter);
app.use('/api/uptime', uptimeRouter);
app.use('/api/ssl', sslRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/git', gitRouter);
app.use('/api/envelopes', envelopesRouter);

// Health check
app.get('/api/health', async (req, res) => {
  const { pool, dbOnline } = await import('./db.js');
  res.json({ ok: true, db: dbOnline, version: '2.0.0', timestamp: new Date().toISOString() });
});

// Available AI providers (checks env, never exposes keys)
app.get('/api/ai/providers', (req, res) => {
  res.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    minimax: !!process.env.MINIMAX_API_KEY,
  });
});

// Serve built React app in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Boot
initDB().then(() => {
  app.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   🚀 Helionyx Business Center v2.0   ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║   Server: http://localhost:${PORT}       ║`);
    console.log('╚══════════════════════════════════════╝\n');
  });
});
