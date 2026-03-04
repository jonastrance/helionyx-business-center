import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api, ls } from '../api.js';

const STATUS_CONFIG = {
  idea:     { label: 'Idea',     cls: 'badge-muted',   icon: '💡' },
  active:   { label: 'Active',   cls: 'badge-teal',    icon: '🔨' },
  paused:   { label: 'Paused',   cls: 'badge-yellow',  icon: '⏸' },
  complete: { label: 'Complete', cls: 'badge-green',   icon: '✅' },
};

const EMPTY_FORM = { name: '', description: '', status: 'idea', tech_stack: '', repo_url: '', local_path: '', notes: '', domain: '', git_branch: '', git_remote: '' };

export default function Projects() {
  const { state, dispatch } = useApp();
  const [loaded, setLoaded]         = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [expanded, setExpanded]     = useState(null);
  const [scanning, setScanning]     = useState(false);
  const [scanPath, setScanPath]     = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError]   = useState('');
  const [newTask, setNewTask]       = useState({});
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (loaded) return;
    setLoaded(true);
    async function load() {
      if (state.serverOnline) {
        try {
          const data = await api.get('/api/projects');
          dispatch({ type: 'SET_PROJECTS', payload: data });
          return;
        } catch {}
      }
      dispatch({ type: 'SET_PROJECTS', payload: ls.get('projects', []) });
    }
    load();
  }, [loaded, state.serverOnline, dispatch]);

  const projects = state.projects;

  async function createProject() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      tech_stack: form.tech_stack.split(',').map(s => s.trim()).filter(Boolean),
    };
    try {
      let p;
      if (state.serverOnline) {
        p = await api.post('/api/projects', payload);
      } else {
        p = { id: Date.now(), ...payload, tasks: [], created_at: new Date().toISOString() };
        ls.set('projects', [p, ...projects]);
      }
      dispatch({ type: 'ADD_PROJECT', payload: p });
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function updateStatus(proj, newStatus) {
    const updated = { ...proj, status: newStatus };
    if (state.serverOnline) {
      try { await api.put(`/api/projects/${proj.id}`, updated); } catch {}
    } else {
      ls.set('projects', projects.map(p => p.id === proj.id ? updated : p));
    }
    dispatch({ type: 'UPDATE_PROJECT', payload: updated });
  }

  async function deleteProject(id) {
    if (!confirm('Delete this project?')) return;
    if (state.serverOnline) {
      try { await api.delete(`/api/projects/${id}`); } catch {}
    } else {
      ls.set('projects', projects.filter(p => p.id !== id));
    }
    dispatch({ type: 'DEL_PROJECT', payload: { id } });
    if (expanded === id) setExpanded(null);
  }

  async function addTask(projectId) {
    const content = newTask[projectId]?.trim();
    if (!content) return;
    let task;
    if (state.serverOnline) {
      try { task = await api.post(`/api/projects/${projectId}/tasks`, { content }); }
      catch { task = { id: Date.now(), project_id: projectId, content, done: false }; }
    } else {
      task = { id: Date.now(), project_id: projectId, content, done: false };
    }
    const proj = projects.find(p => p.id === projectId);
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...proj, tasks: [...(proj.tasks || []), task] } });
    setNewTask(prev => ({ ...prev, [projectId]: '' }));
  }

  async function toggleTask(projectId, taskId, done) {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    const updatedTasks = proj.tasks.map(t => t.id === taskId ? { ...t, done } : t);
    if (state.serverOnline) {
      try { await api.put(`/api/projects/${projectId}/tasks/${taskId}`, { done }); } catch {}
    }
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...proj, tasks: updatedTasks } });
  }

  async function scan() {
    if (!scanPath.trim()) return;
    setScanning(true);
    setScanResult(null);
    setScanError('');
    try {
      if (!state.serverOnline) {
        setScanError('Server must be running to scan folders. Start the server and try again.');
        return;
      }
      const result = await api.post('/api/scan', { path: scanPath.trim() });
      if (result.error) { setScanError(result.error); }
      else { setScanResult(result); }
    } catch (e) {
      setScanError(e.message);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="panel-scroll">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">📁 Projects</h1>
          <p className="text-muted text-sm mt-0.5">Track builds, codebases, and ideas</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '✕ Cancel' : '+ New Project'}
        </button>
      </div>

      {/* New project form */}
      {showForm && (
        <div className="card mb-6 fade-in">
          <div className="card-title">New Project</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input className="input col-span-2" placeholder="Project name *" value={form.name}
                   onChange={e => setForm(p => ({...p, name: e.target.value}))} />
            <input className="input col-span-2" placeholder="Description" value={form.description}
                   onChange={e => setForm(p => ({...p, description: e.target.value}))} />
            <input className="input" placeholder="Tech stack (comma separated: React, Node, Postgres)"
                   value={form.tech_stack} onChange={e => setForm(p => ({...p, tech_stack: e.target.value}))} />
            <select className="select" value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))}>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <input className="input" placeholder="Repo URL (optional)" value={form.repo_url}
                   onChange={e => setForm(p => ({...p, repo_url: e.target.value}))} />
            <input className="input" placeholder="Local path (optional, for scanning)" value={form.local_path}
                   onChange={e => setForm(p => ({...p, local_path: e.target.value}))} />
            <input className="input" placeholder="Domain (optional, e.g. helionyxcommons.com)" value={form.domain}
                   onChange={e => setForm(p => ({...p, domain: e.target.value}))} />
            <input className="input" placeholder="Git branch (optional, e.g. main)" value={form.git_branch}
                   onChange={e => setForm(p => ({...p, git_branch: e.target.value}))} />
            <textarea className="input col-span-2 resize-none" rows={2} placeholder="Notes (optional)"
                      value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
          </div>
          <div className="flex gap-2">
            <button onClick={createProject} disabled={!form.name.trim() || saving} className="btn-primary disabled:opacity-40">
              {saving ? '…' : '✓ Create Project'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Folder Scanner */}
      <div className="card mb-6">
        <div className="card-title">🔍 Folder Scanner</div>
        <p className="text-xs text-muted mb-3">Paste a local path to detect tech stack, file stats, and project structure.</p>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="e.g. C:\Users\mauld\projects\my-app" value={scanPath}
                 onChange={e => setScanPath(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && scan()} />
          <button onClick={scan} disabled={scanning || !scanPath.trim()} className="btn-primary disabled:opacity-40">
            {scanning ? '…' : 'Scan'}
          </button>
        </div>
        {scanError && <div className="mt-3 text-xs text-danger bg-danger/10 rounded-lg p-3">{scanError}</div>}
        {scanResult && <ScanResult result={scanResult} onCreateProject={(r) => {
          setForm(p => ({ ...p, name: r.framework || r.path.split(/[/\\]/).pop(), local_path: r.path,
            tech_stack: r.techStack.join(', '), status: 'active' }));
          setShowForm(true);
          setScanResult(null);
        }} />}
      </div>

      {/* Project cards */}
      {projects.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <div className="text-4xl mb-3">📁</div>
          <div className="font-medium">No projects yet</div>
          <div className="text-sm mt-1">Create your first project or scan a folder above</div>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(proj => {
            const sc = STATUS_CONFIG[proj.status] || STATUS_CONFIG.idea;
            const isExpanded = expanded === proj.id;
            const tasks = proj.tasks || [];
            const done = tasks.filter(t => t.done).length;
            return (
              <div key={proj.id} className="card hover:border-teal/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => setExpanded(isExpanded ? null : proj.id)}
                              className="font-semibold text-white hover:text-teal transition-colors text-left">
                        {proj.name}
                      </button>
                      <span className={sc.cls}>{sc.icon} {sc.label}</span>
                      {(proj.tech_stack || []).slice(0, 4).map(t => (
                        <span key={t} className="tag text-xs">{t}</span>
                      ))}
                    </div>
                    {proj.description && <p className="text-sm text-muted mt-1 line-clamp-2">{proj.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted flex-wrap">
                      {tasks.length > 0 && <span>{done}/{tasks.length} tasks</span>}
                      {proj.repo_url && <a href={proj.repo_url} target="_blank" rel="noreferrer" className="hover:text-teal">Repo ↗</a>}
                      {proj.local_path && <span title={proj.local_path}>📂 {proj.local_path.split(/[/\\]/).pop()}</span>}
                      {proj.domain && <span className="text-teal">🌐 {proj.domain}</span>}
                      {proj.git_branch && <span className="text-purple-400">⎇ {proj.git_branch}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <select value={proj.status} onChange={e => updateStatus(proj, e.target.value)}
                            className="select text-xs py-1">
                      {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                    <button onClick={() => deleteProject(proj.id)} className="btn-danger py-1 px-2 text-xs">🗑</button>
                  </div>
                </div>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border fade-in">
                    {proj.notes && (
                      <div className="mb-4">
                        <div className="text-xs text-muted uppercase tracking-wider mb-1">Notes</div>
                        <p className="text-sm text-white/80 whitespace-pre-wrap">{proj.notes}</p>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-muted uppercase tracking-wider mb-2">Tasks</div>
                      <div className="space-y-1.5 mb-3">
                        {tasks.map(task => (
                          <div key={task.id} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={task.done}
                                   onChange={e => toggleTask(proj.id, task.id, e.target.checked)}
                                   className="accent-teal cursor-pointer" />
                            <span className={task.done ? 'line-through text-muted' : 'text-white'}>{task.content}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input className="input flex-1 text-xs py-1.5"
                               placeholder="Add a task..."
                               value={newTask[proj.id] || ''}
                               onChange={e => setNewTask(prev => ({...prev, [proj.id]: e.target.value}))}
                               onKeyDown={e => e.key === 'Enter' && addTask(proj.id)} />
                        <button onClick={() => addTask(proj.id)} className="btn-ghost text-xs py-1.5">+ Add</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScanResult({ result, onCreateProject }) {
  const sizeMB = (result.totalSize / 1024 / 1024).toFixed(1);
  return (
    <div className="mt-4 bg-surface2 rounded-xl p-4 border border-teal/20 fade-in">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold text-white text-sm">{result.path.split(/[/\\]/).pop()}</div>
          <div className="text-xs text-muted font-mono">{result.path}</div>
        </div>
        <button onClick={() => onCreateProject(result)} className="btn-primary text-xs">+ Add Project</button>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          { label: 'Files',   val: result.fileCount },
          { label: 'Folders', val: result.dirCount },
          { label: 'Size',    val: `${sizeMB} MB` },
        ].map(s => (
          <div key={s.label} className="bg-surface rounded-lg p-2 text-center">
            <div className="text-teal font-bold">{s.val}</div>
            <div className="text-muted text-xs">{s.label}</div>
          </div>
        ))}
      </div>
      {result.techStack.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-muted mb-1">Tech Stack</div>
          <div className="flex gap-1.5 flex-wrap">
            {result.techStack.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        </div>
      )}
      <div className="flex gap-3 text-xs text-muted">
        {result.gitRepo && <span className="text-success">✓ Git repo</span>}
        {result.hasEnvFile && <span className="text-warn">⚠️ .env found</span>}
        {result.hasDockerfile && <span className="text-sky">🐳 Docker</span>}
        {result.packageJson?.name && <span>📦 {result.packageJson.name}</span>}
      </div>
    </div>
  );
}
