import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api, ls } from '../api.js';

const TYPE_OPTIONS = [
  { value: 'generic', label: 'Generic', icon: '📦' },
  { value: 'client', label: 'Client', icon: '👤' },
  { value: 'hosting', label: 'Hosting', icon: '🖥️' },
  { value: 'project', label: 'Project', icon: '📁' },
  { value: 'domain', label: 'Domain', icon: '🌐' },
];

const EMPTY_FORM = {
  name: '', type: 'generic', client_name: '', client_email: '', company: '',
  domain: '', server_ip: '', server_url: '', whm_username: '', cpanel_username: '',
  registrar: '', registrar_account: '', billing_cycle: '', monthly_cost: '',
  ssl_valid_to: '', ssl_issuer: '', notes: ''
};

export default function Envelopes() {
  const { state, dispatch } = useApp();
  const [loaded, setLoaded] = useState(false);
  const [envelopes, setEnvelopes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (loaded) return;
    setLoaded(true);
    async function load() {
      if (state.serverOnline) {
        try {
          const data = await api.get('/api/envelopes');
          setEnvelopes(data);
          return;
        } catch {}
      }
      setEnvelopes(ls.get('envelopes', []));
    }
    load();
  }, [loaded, state.serverOnline]);

  async function saveEnvelope() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (state.serverOnline) {
        const saved = await api.post('/api/envelopes', payload);
        setEnvelopes(prev => [saved, ...prev]);
      } else {
        const local = { id: Date.now(), ...payload, created_at: new Date().toISOString() };
        ls.set('envelopes', [local, ...envelopes]);
        setEnvelopes(prev => [local, ...prev]);
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function deleteEnvelope(id) {
    if (!confirm('Delete this envelope? Projects using it will be unlinked.')) return;
    if (state.serverOnline) {
      try { await api.delete(`/api/envelopes/${id}`); } catch {}
    } else {
      ls.set('envelopes', envelopes.filter(e => e.id !== id));
    }
    setEnvelopes(prev => prev.filter(e => e.id !== id));
    if (expanded === id) setExpanded(null);
  }

  const filtered = filter === 'all' ? envelopes : envelopes.filter(e => e.type === filter);

  return (
    <div className="panel-scroll">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">✉️ Envelopes</h1>
          <p className="text-muted text-sm mt-0.5">Reusable project metadata — clients, hosting, domains</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '✕ Cancel' : '+ New Envelope'}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setFilter('all')} className={`btn-ghost text-xs ${filter === 'all' ? 'bg-surface2' : ''}`}>All</button>
        {TYPE_OPTIONS.map(t => (
          <button key={t.value} onClick={() => setFilter(t.value)}
                  className={`btn-ghost text-xs whitespace-nowrap ${filter === t.value ? 'bg-surface2' : ''}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* New envelope form */}
      {showForm && (
        <div className="card mb-6 fade-in">
          <div className="card-title">New Envelope</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input className="input col-span-2" placeholder="Envelope name *" value={form.name}
                   onChange={e => setForm(p => ({...p, name: e.target.value}))} />
            <select className="select" value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}>
              {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
            <input className="input" placeholder="Client name" value={form.client_name}
                   onChange={e => setForm(p => ({...p, client_name: e.target.value}))} />
            <input className="input" placeholder="Client email" value={form.client_email}
                   onChange={e => setForm(p => ({...p, client_email: e.target.value}))} />
            <input className="input" placeholder="Company" value={form.company}
                   onChange={e => setForm(p => ({...p, company: e.target.value}))} />
            <input className="input" placeholder="Domain (e.g. example.com)" value={form.domain}
                   onChange={e => setForm(p => ({...p, domain: e.target.value}))} />
            <input className="input" placeholder="Server IP" value={form.server_ip}
                   onChange={e => setForm(p => ({...p, server_ip: e.target.value}))} />
            <input className="input" placeholder="Server URL (cPanel/WHM)" value={form.server_url}
                   onChange={e => setForm(p => ({...p, server_url: e.target.value}))} />
            <input className="input" placeholder="WHM username" value={form.whm_username}
                   onChange={e => setForm(p => ({...p, whm_username: e.target.value}))} />
            <input className="input" placeholder="cPanel username" value={form.cpanel_username}
                   onChange={e => setForm(p => ({...p, cpanel_username: e.target.value}))} />
            <input className="input" placeholder="Registrar" value={form.registrar}
                   onChange={e => setForm(p => ({...p, registrar: e.target.value}))} />
            <input className="input" placeholder="Registrar account" value={form.registrar_account}
                   onChange={e => setForm(p => ({...p, registrar_account: e.target.value}))} />
            <input className="input" placeholder="Billing cycle (monthly/yearly)" value={form.billing_cycle}
                   onChange={e => setForm(p => ({...p, billing_cycle: e.target.value}))} />
            <input className="input" type="number" placeholder="Monthly cost ($)" value={form.monthly_cost}
                   onChange={e => setForm(p => ({...p, monthly_cost: e.target.value}))} />
            <input className="input" type="date" placeholder="SSL valid to" value={form.ssl_valid_to}
                   onChange={e => setForm(p => ({...p, ssl_valid_to: e.target.value}))} />
            <input className="input" placeholder="SSL issuer" value={form.ssl_issuer}
                   onChange={e => setForm(p => ({...p, ssl_issuer: e.target.value}))} />
            <textarea className="input col-span-2 resize-none" rows={2} placeholder="Notes"
                      value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
          </div>
          <div className="flex gap-2">
            <button onClick={saveEnvelope} disabled={!form.name.trim() || saving} className="btn-primary disabled:opacity-40">
              {saving ? '…' : '✓ Save Envelope'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Envelope cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <div className="text-4xl mb-3">✉️</div>
          <div className="font-medium">No envelopes yet</div>
          <div className="text-sm mt-1">Create reusable metadata for your projects</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(env => {
            const isExpanded = expanded === env.id;
            const typeInfo = TYPE_OPTIONS.find(t => t.value === env.type) || TYPE_OPTIONS[0];
            return (
              <div key={env.id} className="card hover:border-teal/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => setExpanded(isExpanded ? null : env.id)}
                              className="font-semibold text-white hover:text-teal transition-colors text-left">
                        {env.name}
                      </button>
                      <span className="badge-muted">{typeInfo.icon} {typeInfo.label}</span>
                      {env.domain && <span className="text-teal text-sm">🌐 {env.domain}</span>}
                      {env.client_name && <span className="text-sm text-muted">👤 {env.client_name}</span>}
                      {env.monthly_cost > 0 && <span className="text-sm text-muted">💰 ${env.monthly_cost}/mo</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted flex-wrap">
                      {env.server_ip && <span>🖥️ {env.server_ip}</span>}
                      {env.registrar && <span>📋 {env.registrar}</span>}
                      {env.ssl_valid_to && <span className={new Date(env.ssl_valid_to) < new Date() ? 'text-danger' : ''}>
                        🔒 {env.ssl_valid_to}
                      </span>}
                    </div>
                  </div>
                  <button onClick={() => deleteEnvelope(env.id)} className="btn-danger py-1 px-2 text-xs">🗑</button>
                </div>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border fade-in">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {env.client_email && (
                        <div><span className="text-muted">Email:</span> <a href={`mailto:${env.client_email}`} className="text-teal">{env.client_email}</a></div>
                      )}
                      {env.company && <div><span className="text-muted">Company:</span> {env.company}</div>}
                      {env.server_url && <div><span className="text-muted">Server:</span> <a href={env.server_url} target="_blank" rel="noreferrer" className="text-teal">{env.server_url}</a></div>}
                      {env.whm_username && <div><span className="text-muted">WHM:</span> {env.whm_username}</div>}
                      {env.cpanel_username && <div><span className="text-muted">cPanel:</span> {env.cpanel_username}</div>}
                      {env.registrar_account && <div><span className="text-muted">Registrar:</span> {env.registrar_account}</div>}
                      {env.billing_cycle && <div><span className="text-muted">Billing:</span> {env.billing_cycle}</div>}
                      {env.ssl_issuer && <div><span className="text-muted">SSL Issuer:</span> {env.ssl_issuer}</div>}
                    </div>
                    {env.notes && (
                      <div className="mt-4">
                        <div className="text-xs text-muted uppercase tracking-wider mb-1">Notes</div>
                        <p className="text-sm text-white/80 whitespace-pre-wrap">{env.notes}</p>
                      </div>
                    )}
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
