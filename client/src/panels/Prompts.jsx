import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api, ls } from '../api.js';

const CATEGORIES = [
  { value: 'general', label: 'General', icon: '📝' },
  { value: 'code', label: 'Code', icon: '💻' },
  { value: 'writing', label: 'Writing', icon: '✍️' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'creative', label: 'Creative', icon: '🎨' },
];

const EMPTY_FORM = { title: '', content: '', category: 'general', tags: '' };

export default function Prompts() {
  const { state } = useApp();
  const [loaded, setLoaded] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(null);

  useEffect(() => {
    if (loaded) return;
    setLoaded(true);
    async function load() {
      if (state.serverOnline) {
        try {
          const data = await api.get('/api/prompts');
          setPrompts(data);
          return;
        } catch {}
      }
      setPrompts(ls.get('prompts', []));
    }
    load();
  }, [loaded, state.serverOnline]);

  async function savePrompt() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      if (state.serverOnline) {
        const saved = await api.post('/api/prompts', payload);
        setPrompts(prev => [saved, ...prev]);
      } else {
        const local = { id: Date.now(), ...payload, use_count: 0, created_at: new Date().toISOString() };
        ls.set('prompts', [local, ...prompts]);
        setPrompts(prev => [local, ...prev]);
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function deletePrompt(id) {
    if (!confirm('Delete this prompt?')) return;
    if (state.serverOnline) {
      try { await api.delete(`/api/prompts/${id}`); } catch {}
    } else {
      ls.set('prompts', prompts.filter(p => p.id !== id));
    }
    setPrompts(prev => prev.filter(p => p.id !== id));
    if (expanded === id) setExpanded(null);
  }

  async function usePrompt(prompt) {
    // Copy to clipboard
    await navigator.clipboard.writeText(prompt.content);
    setCopyFeedback(prompt.id);
    setTimeout(() => setCopyFeedback(null), 2000);

    // Increment use count
    if (state.serverOnline) {
      try {
        await api.post(`/api/prompts/${prompt.id}/use`);
        setPrompts(prev => prev.map(p =>
          p.id === prompt.id ? { ...p, use_count: (p.use_count || 0) + 1, last_used: new Date().toISOString() } : p
        ));
      } catch {}
    } else {
      setPrompts(prev => prev.map(p =>
        p.id === prompt.id ? { ...p, use_count: (p.use_count || 0) + 1, last_used: new Date().toISOString() } : p
      ));
      ls.set('prompts', prompts.map(p =>
        p.id === prompt.id ? { ...p, use_count: (p.use_count || 0) + 1, last_used: new Date().toISOString() } : p
      ));
    }

    // Dispatch event for Abbot to pick up
    window.dispatchEvent(new CustomEvent('abbot-inject', { detail: prompt.content }));
  }

  const filtered = prompts.filter(p => {
    const matchesFilter = filter === 'all' || p.category === filter;
    const matchesSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="panel-scroll">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">📋 Prompts</h1>
          <p className="text-muted text-sm mt-0.5">Save and organize your prompts for quick reuse</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '✕ Cancel' : '+ New Prompt'}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6">
        <input
          className="input flex-1"
          placeholder="Search prompts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setFilter('all')} className={`btn-ghost text-xs ${filter === 'all' ? 'bg-surface2' : ''}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setFilter(c.value)}
                  className={`btn-ghost text-xs whitespace-nowrap ${filter === c.value ? 'bg-surface2' : ''}`}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* New prompt form */}
      {showForm && (
        <div className="card mb-6 fade-in">
          <div className="card-title">New Prompt</div>
          <div className="space-y-3 mb-3">
            <input className="input" placeholder="Prompt title *" value={form.title}
                   onChange={e => setForm(p => ({...p, title: e.target.value}))} />
            <textarea className="input resize-none" rows={6} placeholder="Prompt content... *"
                      value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))} />
            <div className="flex gap-3">
              <select className="select flex-1" value={form.category}
                      onChange={e => setForm(p => ({...p, category: e.target.value}))}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
              <input className="input flex-1" placeholder="Tags (comma separated)" value={form.tags}
                     onChange={e => setForm(p => ({...p, tags: e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={savePrompt} disabled={!form.title.trim() || !form.content.trim() || saving}
                    className="btn-primary disabled:opacity-40">
              {saving ? '…' : '✓ Save Prompt'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Prompt cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-medium">No prompts yet</div>
          <div className="text-sm mt-1">Save prompts for quick reuse in Abbot</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(prompt => {
            const isExpanded = expanded === prompt.id;
            const cat = CATEGORIES.find(c => c.value === prompt.category) || CATEGORIES[0];
            return (
              <div key={prompt.id} className="card hover:border-teal/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => setExpanded(isExpanded ? null : prompt.id)}
                              className="font-semibold text-white hover:text-teal transition-colors text-left">
                        {prompt.title}
                      </button>
                      <span className="badge-muted">{cat.icon} {cat.label}</span>
                      {(prompt.tags || []).slice(0, 3).map(t => (
                        <span key={t} className="tag text-xs">{t}</span>
                      ))}
                    </div>
                    {!isExpanded && (
                      <p className="text-sm text-muted mt-1 line-clamp-2">{prompt.content}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted flex-wrap">
                      {prompt.use_count > 0 && <span>Used {prompt.use_count}x</span>}
                      {prompt.last_used && <span>Last: {new Date(prompt.last_used).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => usePrompt(prompt)}
                            className={`btn-primary py-1 px-2 text-xs ${copyFeedback === prompt.id ? 'bg-success' : ''}`}>
                      {copyFeedback === prompt.id ? '✓ Copied!' : '📋 Use'}
                    </button>
                    <button onClick={() => deletePrompt(prompt.id)} className="btn-danger py-1 px-2 text-xs">🗑</button>
                  </div>
                </div>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border fade-in">
                    <div className="bg-surface2 rounded-lg p-3 mb-3">
                      <pre className="text-sm text-white/80 whitespace-pre-wrap font-mono">{prompt.content}</pre>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(prompt.tags || []).map(t => (
                        <span key={t} className="tag">{t}</span>
                      ))}
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
