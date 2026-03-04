import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const r = Router();
const execAsync = promisify(exec);

// Get git status for a project
r.get('/status/:projectId', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    const { rows } = await pool.query('SELECT local_path, git_remote, git_branch FROM projects WHERE id = $1', [req.params.projectId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = rows[0];
    if (!project.local_path) {
      return res.json({ error: 'No local path configured', isGit: false });
    }

    try {
      const { stdout: branch } = await execAsync('git branch --show-current', { cwd: project.local_path }).catch(() => ({ stdout: 'main' }));
      const { stdout: status } = await execAsync('git status --porcelain', { cwd: project.local_path }).catch(() => ({ stdout: '' }));
      const { stdout: remote } = await execAsync('git remote get-url origin', { cwd: project.local_path }).catch(() => ({ stdout: '' }));

      res.json({
        isGit: true,
        branch: branch.trim(),
        remote: remote.trim() || project.git_remote,
        hasChanges: status.trim().length > 0,
        changes: status.trim().split('\n').filter(Boolean),
      });
    } catch (e) {
      res.json({ isGit: false, error: e.message });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get git log for a project
r.get('/log/:projectId', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    const { rows } = await pool.query('SELECT local_path FROM projects WHERE id = $1', [req.params.projectId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const localPath = rows[0].local_path;
    if (!localPath) {
      return res.json([]);
    }

    try {
      const { stdout } = await execAsync('git log --oneline -10', { cwd: localPath });
      const commits = stdout.trim().split('\n').filter(Boolean).map(line => {
        const match = line.match(/^([a-f0-9]+)\s+(.*)$/);
        return match ? { hash: match[1], message: match[2] } : { hash: '', message: line };
      });
      res.json(commits);
    } catch {
      res.json([]);
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Run git pull
r.post('/pull/:projectId', async (req, res) => {
  try {
    const { pool } = await import('../db.js');
    const { rows } = await pool.query('SELECT local_path FROM projects WHERE id = $1', [req.params.projectId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const localPath = rows[0].local_path;
    if (!localPath) {
      return res.status(400).json({ error: 'No local path configured' });
    }

    try {
      const { stdout, stderr } = await execAsync('git pull', { cwd: localPath });
      res.json({ success: true, output: stdout || stderr });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default r;
