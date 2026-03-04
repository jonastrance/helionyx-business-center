import { Router } from 'express';
import { pool } from '../db.js';

const r = Router();

r.get('/', async (req, res) => {
  if (!pool) return res.json([]);
  try {
    const { rows: projects } = await pool.query('SELECT * FROM projects ORDER BY updated_at DESC');
    const { rows: tasks } = await pool.query('SELECT * FROM project_tasks ORDER BY created_at');
    res.json(projects.map(p => ({ ...p, tasks: tasks.filter(t => t.project_id === p.id) })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/', async (req, res) => {
  const { name, description, status = 'idea', tech_stack = [], repo_url, local_path, notes, domain, git_branch, git_remote } = req.body;
  if (!pool) return res.json({ id: Date.now(), name, description, status, tech_stack, repo_url, local_path, notes, domain, git_branch, git_remote, tasks: [] });
  try {
    const { rows } = await pool.query(
      'INSERT INTO projects (name, description, status, tech_stack, repo_url, local_path, notes, domain, git_branch, git_remote) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [name, description, status, tech_stack, repo_url, local_path, notes, domain, git_branch, git_remote]
    );
    res.json({ ...rows[0], tasks: [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.put('/:id', async (req, res) => {
  const { name, description, status, tech_stack, repo_url, local_path, notes, domain, git_branch, git_remote } = req.body;
  if (!pool) return res.json({ ok: true });
  try {
    const { rows } = await pool.query(
      `UPDATE projects SET name=COALESCE($1,name), description=COALESCE($2,description),
       status=COALESCE($3,status), tech_stack=COALESCE($4,tech_stack),
       repo_url=COALESCE($5,repo_url), local_path=COALESCE($6,local_path),
       notes=COALESCE($7,notes), domain=COALESCE($8,domain), git_branch=COALESCE($9,git_branch),
       git_remote=COALESCE($10,git_remote), updated_at=NOW() WHERE id=$11 RETURNING *`,
      [name, description, status, tech_stack, repo_url, local_path, notes, domain, git_branch, git_remote, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.delete('/:id', async (req, res) => {
  if (!pool) return res.json({ ok: true });
  try {
    await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Project tasks
r.post('/:id/tasks', async (req, res) => {
  const { content } = req.body;
  if (!pool) return res.json({ id: Date.now(), project_id: req.params.id, content, done: false });
  try {
    const { rows } = await pool.query(
      'INSERT INTO project_tasks (project_id, content) VALUES ($1,$2) RETURNING *',
      [req.params.id, content]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.put('/:id/tasks/:taskId', async (req, res) => {
  const { done, content } = req.body;
  if (!pool) return res.json({ ok: true });
  try {
    const { rows } = await pool.query(
      'UPDATE project_tasks SET done=COALESCE($1,done), content=COALESCE($2,content) WHERE id=$3 RETURNING *',
      [done, content, req.params.taskId]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.delete('/:id/tasks/:taskId', async (req, res) => {
  if (!pool) return res.json({ ok: true });
  try {
    await pool.query('DELETE FROM project_tasks WHERE id=$1', [req.params.taskId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default r;
