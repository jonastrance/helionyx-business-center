import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api, ls } from '../api.js';
import { SETUP_CATEGORIES, SETUP_DEFAULTS } from '../data/setupItems.js';

export default function BusinessSetup() {
  const { state, dispatch } = useApp();
  const [loaded, setLoaded] = useState(false);

  // Merge defaults + server state
  const setupState = state.setupState;

  useEffect(() => {
    if (loaded) return;
    setLoaded(true);
    async function load() {
      let overrides = {};
      if (state.serverOnline) {
        try {
          const data = await api.get('/api/setup');
          overrides = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.done]));
        } catch {}
      } else {
        overrides = ls.get('setup', {});
      }
      dispatch({ type: 'SET_SETUP', payload: { ...SETUP_DEFAULTS, ...overrides } });
    }
    load();
  }, [loaded, state.serverOnline, dispatch]);

  async function toggle(id, currentDone) {
    const done = !currentDone;
    dispatch({ type: 'TOGGLE_SETUP', id, done });
    if (state.serverOnline) {
      try { await api.put(`/api/setup/${id}`, { done }); } catch {}
    } else {
      ls.set('setup', { ...ls.get('setup', {}), [id]: done });
    }
  }

  // Global progress
  const allItems = SETUP_CATEGORIES.flatMap(c => c.items);
  const totalDone = allItems.filter(item => setupState[item.id]).length;
  const totalPct  = Math.round((totalDone / allItems.length) * 100);

  // Blockers
  const blockers = allItems.filter(item => item.blocker && !setupState[item.id]);

  const goAbbot = (prompt) => {
    dispatch({ type: 'SET_PANEL', payload: 'abbot' });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('abbot-inject', { detail: prompt }));
    }, 300);
  };

  return (
    <div className="panel-scroll">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">⚙️ Business Setup</h1>
          <p className="text-muted text-sm mt-0.5">Track everything needed to run Helionyx professionally</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-teal">{totalPct}%</div>
          <div className="text-xs text-muted">{totalDone}/{allItems.length} done</div>
        </div>
      </div>

      {/* Overall progress */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 bg-surface2 rounded-full h-3 overflow-hidden">
            <div className="bg-teal h-full rounded-full transition-all duration-500"
                 style={{ width: `${totalPct}%` }} />
          </div>
          <span className="text-sm font-medium text-teal">{totalPct}%</span>
        </div>
        <div className="text-xs text-muted">{totalDone} of {allItems.length} items complete</div>
      </div>

      {/* Blockers */}
      {blockers.length > 0 && (
        <div className="alert-danger rounded-xl p-4 mb-6">
          <div className="font-semibold text-sm mb-1">🚫 {blockers.length} Blocker{blockers.length !== 1 ? 's' : ''}</div>
          {blockers.map(b => (
            <div key={b.id} className="text-xs opacity-80">{b.label} — {b.desc}</div>
          ))}
        </div>
      )}

      {/* Categories */}
      {SETUP_CATEGORIES.map(cat => {
        const catItems = cat.items;
        const catDone  = catItems.filter(item => setupState[item.id]).length;
        const catPct   = Math.round((catDone / catItems.length) * 100);

        return (
          <div key={cat.id} className="card mb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-semibold text-white">{cat.title}</span>
                  <span className="badge-muted">{catDone}/{catItems.length}</span>
                </div>
                <div className="text-xs text-muted mt-0.5">{cat.description}</div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className={`text-lg font-bold ${catPct === 100 ? 'text-success' : catPct > 50 ? 'text-teal' : 'text-warn'}`}>
                  {catPct}%
                </div>
              </div>
            </div>

            {/* Category progress bar */}
            <div className="bg-surface2 rounded-full h-1.5 mb-4 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${catPct === 100 ? 'bg-success' : 'bg-teal'}`}
                   style={{ width: `${catPct}%` }} />
            </div>

            {/* Items */}
            <div className="space-y-2">
              {catItems.map(item => {
                const done = !!setupState[item.id];
                return (
                  <div key={item.id}
                       className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer group
                         ${item.blocker && !done
                           ? 'border-danger/30 bg-danger/5 hover:border-danger/50'
                           : done
                             ? 'border-border/30 bg-success/5 hover:border-success/20'
                             : 'border-border hover:border-teal/30 hover:bg-surface2/50'}`}
                       onClick={() => toggle(item.id, done)}
                  >
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5 border transition-colors
                      ${done ? 'bg-success border-success text-bg' : 'border-muted group-hover:border-teal'}`}>
                      {done && <span className="text-xs font-bold">✓</span>}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${done ? 'text-muted line-through' : 'text-white'}`}>
                          {item.label}
                        </span>
                        {item.blocker && !done && <span className="badge-red text-xs">BLOCKER</span>}
                        {item.required && !item.blocker && !done && <span className="badge-orange text-xs">Required</span>}
                        {item.optional && !done && (
                          <span className="badge-muted text-xs">
                            {item.optReqNote ? `Optional → ${item.optReqNote}` : 'Optional'}
                          </span>
                        )}
                      </div>
                      <div className={`text-xs mt-0.5 ${done ? 'text-muted/60' : 'text-muted'}`}>{item.desc}</div>
                    </div>

                    {/* Help button */}
                    {!done && (
                      <button
                        className="btn-ghost text-xs py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={e => { e.stopPropagation(); goAbbot(`Help me with: ${item.label} — ${item.desc}`); }}
                      >
                        Ask Abbot
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
