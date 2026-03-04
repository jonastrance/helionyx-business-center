import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api, ls } from '../api.js';

function timeAgo(ts) {
  const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return `${Math.floor(secs/60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs/3600)}h ago`;
  return `${Math.floor(secs/86400)}d ago`;
}

export default function Thoughts() {
  const { state, dispatch } = useApp();
  const [content, setContent]   = useState('');
  const [tagInput, setTagInput]  = useState('');
  const [search, setSearch]      = useState('');
  const [loading, setLoading]    = useState(false);
  const [loaded, setLoaded]      = useState(false);

  // Load thoughts on mount
  useEffect(() => {
    if (loaded) return;
    setLoaded(true);
    async function load() {
      if (state.serverOnline) {
        try {
          const data = await api.get('/api/thoughts');
          dispatch({ type: 'SET_THOUGHTS', payload: data });
          return;
        } catch {}
      }
      dispatch({ type: 'SET_THOUGHTS', payload: ls.get('thoughts', []) });
    }
    load();
  }, [loaded, state.serverOnline, dispatch]);

  const thoughts = state.thoughts;

  const filtered = search
    ? thoughts.filter(t =>
        t.content.toLowerCase().includes(search.toLowerCase()) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      )
    : thoughts;

  async function save(sendToAbbot = false) {
    if (!content.trim()) return;
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    setLoading(true);

    try {
      let saved;
      if (state.serverOnline) {
        saved = await api.post('/api/thoughts', { content: content.trim(), tags });
      } else {
        saved = { id: Date.now(), content: content.trim(), tags, created_at: new Date().toISOString() };
        ls.set('thoughts', [saved, ...thoughts]);
      }
      dispatch({ type: 'ADD_THOUGHT', payload: saved });
      const captured = content.trim();
      setContent('');
      setTagInput('');

      if (sendToAbbot) {
        dispatch({ type: 'SET_PANEL', payload: 'abbot' });
        // Small delay then inject the thought as a question
        setTimeout(() => {
          const event = new CustomEvent('abbot-inject', { detail: `I had a thought I want to explore: ${captured}` });
          window.dispatchEvent(event);
        }, 300);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTh(id) {
    if (state.serverOnline) {
      try { await api.delete(`/api/thoughts/${id}`); } catch {}
    } else {
      ls.set('thoughts', thoughts.filter(t => t.id !== id));
    }
    dispatch({ type: 'DEL_THOUGHT', payload: { id } });
  }

  return (
    <div className="panel-scroll">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">💬 Thoughts</h1>
          <p className="text-muted text-sm mt-0.5">Capture anything — ideas, questions, notes. Nothing gets lost.</p>
        </div>
        <div className="text-xs text-muted">{thoughts.length} saved</div>
      </div>

      {/* Capture box */}
      <div className="card mb-6">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) save(); }}
          placeholder="What's on your mind? A business idea, a domain to check, a todo, anything…"
          rows={4}
          className="input mb-3 resize-none text-sm leading-relaxed"
        />
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Tags (comma separated): idea, domain, whmcs..."
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            className="input flex-1 text-xs"
          />
          <button onClick={() => save(false)} disabled={!content.trim() || loading}
                  className="btn-primary whitespace-nowrap disabled:opacity-40">
            {loading ? '…' : '💾 Save'}
          </button>
          <button onClick={() => save(true)} disabled={!content.trim() || loading}
                  className="btn-ghost whitespace-nowrap disabled:opacity-40 text-xs">
            Ask Abbot →
          </button>
        </div>
        <div className="text-xs text-muted mt-2">Ctrl+Enter to save quickly</div>
      </div>

      {/* Search */}
      {thoughts.length > 0 && (
        <input
          type="text"
          placeholder="Search thoughts and tags…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input mb-4 text-sm"
        />
      )}

      {/* Thoughts list */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted">
          <div className="text-4xl mb-3">🧠</div>
          <div className="font-medium">No thoughts yet</div>
          <div className="text-sm mt-1">Type something above and hit Save</div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(thought => (
          <div key={thought.id} className="card group hover:border-teal/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">{thought.content}</p>
                {(thought.tags || []).length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {thought.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-muted mt-2">{timeAgo(thought.created_at)}</div>
              </div>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => {
                    dispatch({ type: 'SET_PANEL', payload: 'abbot' });
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('abbot-inject', {
                        detail: `I had a thought: ${thought.content}`
                      }));
                    }, 300);
                  }}
                  className="btn-ghost text-xs py-1 px-2"
                  title="Ask Abbot about this thought"
                >Ask Abbot</button>
                <button onClick={() => deleteTh(thought.id)}
                        className="btn-danger text-xs py-1 px-2">🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
