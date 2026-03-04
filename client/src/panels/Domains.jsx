import { useState, useMemo } from 'react';
import { DOMAINS, daysLeft, urgencyClass, urgencyBadge, fmtDate } from '../data/domains.js';

export default function Domains() {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [sortBy, setSortBy]   = useState('expiry');

  const filtered = useMemo(() => {
    let list = [...DOMAINS];
    if (search) list = list.filter(d => d.n.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'soon')  list = list.filter(d => daysLeft(d.e) <= 60);
    if (filter === 'alert') list = list.filter(d => d.s === 'alert');
    if (sortBy === 'name')  list.sort((a, b) => a.n.localeCompare(b.n));
    else                    list.sort((a, b) => new Date(a.e) - new Date(b.e));
    return list;
  }, [search, filter, sortBy]);

  const stats = {
    alert:  DOMAINS.filter(d => d.s === 'alert').length,
    d14:    DOMAINS.filter(d => daysLeft(d.e) <= 14).length,
    d30:    DOMAINS.filter(d => daysLeft(d.e) <= 30).length,
    d60:    DOMAINS.filter(d => daysLeft(d.e) <= 60).length,
    safe:   DOMAINS.filter(d => daysLeft(d.e) > 60).length,
  };

  return (
    <div className="panel-scroll">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Domain Portfolio</h1>
        <a href="https://ap.www.namecheap.com/domains/list/" target="_blank" rel="noreferrer"
           className="btn-ghost text-xs">Manage at Namecheap ↗</a>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          { label: 'Total', val: DOMAINS.length, cls: 'text-teal' },
          { label: '⚠️ Alert', val: stats.alert, cls: 'text-danger' },
          { label: '≤14 days', val: stats.d14, cls: 'text-danger' },
          { label: '≤30 days', val: stats.d30, cls: 'text-warn' },
          { label: '≤60 days', val: stats.d60, cls: 'text-yellow-400' },
          { label: '60+ days', val: stats.safe, cls: 'text-success' },
        ].map(s => (
          <div key={s.label} className="bg-surface2 border border-border rounded-lg px-3 py-2 text-center min-w-16">
            <div className={`text-lg font-bold ${s.cls}`}>{s.val}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search domains..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input flex-1 min-w-48"
        />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="select">
          <option value="all">All domains</option>
          <option value="soon">Expiring ≤60 days</option>
          <option value="alert">Alert status only</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="select">
          <option value="expiry">Sort by expiry</option>
          <option value="name">Sort by name</option>
        </select>
      </div>

      <div className="text-xs text-muted mb-3">Showing {filtered.length} of {DOMAINS.length} domains</div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface2">
            <tr className="text-left text-muted text-xs">
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Days Left</th>
              <th className="px-4 py-3 font-medium">Auto-Renew</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => {
              const days = daysLeft(d.e);
              return (
                <tr key={d.n}
                    className={`border-t border-border/50 hover:bg-surface2/50 transition-colors ${i % 2 === 0 ? '' : 'bg-surface2/20'}`}>
                  <td className="px-4 py-2.5 font-medium">
                    <a href={`https://${d.n}`} target="_blank" rel="noreferrer"
                       className="hover:text-teal transition-colors">{d.n}</a>
                  </td>
                  <td className="px-4 py-2.5">
                    {d.s === 'alert'
                      ? <span className="badge-red">⚠️ ALERT</span>
                      : <span className="badge-green">✓ Active</span>}
                  </td>
                  <td className={`px-4 py-2.5 ${urgencyClass(days)}`}>{fmtDate(d.e)}</td>
                  <td className={`px-4 py-2.5 font-mono font-semibold ${urgencyClass(days)}`}>
                    {days <= 0 ? 'EXPIRED' : `${days}d`}
                  </td>
                  <td className="px-4 py-2.5 text-success text-xs">✓ ON</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
