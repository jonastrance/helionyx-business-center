import { useApp } from '../context/AppContext.jsx';
import { DOMAINS, daysLeft, urgencyClass, fmtDate } from '../data/domains.js';

const expiringSoon = DOMAINS.filter(d => daysLeft(d.e) <= 60)
  .sort((a, b) => new Date(a.e) - new Date(b.e))
  .slice(0, 12);

const alertDomains = DOMAINS.filter(d => d.s === 'alert');
const jonasDays = daysLeft('2026-03-17');
const hostDays  = daysLeft('2026-03-19');

function StatCard({ label, value, sub, color = 'teal' }) {
  const colors = { teal: 'text-teal', danger: 'text-danger', warn: 'text-warn', sky: 'text-sky' };
  return (
    <div className="card flex-1">
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
      <div className="text-sm text-white mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const { dispatch } = useApp();
  const go = (p) => dispatch({ type: 'SET_PANEL', payload: p });

  return (
    <div className="panel-scroll">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Overview</h1>
          <p className="text-muted text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <a href="https://helionyxcommons.com" target="_blank" rel="noreferrer"
           className="btn-ghost text-xs">helionyxcommons.com ↗</a>
      </div>

      {/* Alerts */}
      <div className="space-y-2 mb-6">
        {jonasDays <= 30 && (
          <div className="alert-danger rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl">🚨</span>
            <div className="flex-1">
              <div className="font-semibold">jonastrance.com expires in {jonasDays} day{jonasDays !== 1 ? 's' : ''}!</div>
              <div className="text-sm opacity-80">Domain is in Alert status at Namecheap — renew immediately.</div>
            </div>
            <a href="https://ap.www.namecheap.com/domains/list/" target="_blank" rel="noreferrer"
               className="btn-primary text-xs whitespace-nowrap">Renew ↗</a>
          </div>
        )}
        {hostDays <= 30 && (
          <div className="alert-danger rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <div className="font-semibold">Reseller Hosting expires in {hostDays} days — AUTO-RENEW IS OFF</div>
              <div className="text-sm opacity-80">Renew Namecheap Reseller Hosting before Mar 19 or all hosted sites go down.</div>
            </div>
            <a href="https://ap.www.namecheap.com" target="_blank" rel="noreferrer"
               className="btn-primary text-xs whitespace-nowrap">Renew ↗</a>
          </div>
        )}
        <div className="alert-warn rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl">💳</span>
          <div className="flex-1">
            <div className="font-semibold">No payment gateway configured</div>
            <div className="text-sm opacity-80">You cannot accept money until Stripe or PayPal is set up in WHMCS.</div>
          </div>
          <button onClick={() => go('setup')} className="btn-ghost text-xs whitespace-nowrap">Fix it →</button>
        </div>
        <div className="alert-info rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl">🎯</span>
          <div className="flex-1">
            <div className="font-semibold">Goal: First paying customer</div>
            <div className="text-sm opacity-80">Payment gateway + ToS → then you can start accepting orders.</div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-6">
        <StatCard label="Total Domains"    value={DOMAINS.length}  sub="All at Namecheap"      color="teal" />
        <StatCard label="Expiring ≤30 days" value={DOMAINS.filter(d => daysLeft(d.e) <= 30).length} sub="Needs attention" color="danger" />
        <StatCard label="Expiring ≤60 days" value={DOMAINS.filter(d => daysLeft(d.e) <= 60).length} sub="Monitor closely" color="warn" />
        <StatCard label="MRR"              value="$0"              sub="First customer target" color="sky" />
      </div>

      {/* Quick links */}
      <div className="card mb-6">
        <div className="card-title">Quick Links</div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'WHMCS Admin', url: 'https://helionyxcommons.com/admin' },
            { label: 'WHM', url: 'https://host39.registrar-servers.com:2087' },
            { label: 'cPanel', url: 'https://host39.registrar-servers.com:2083' },
            { label: 'Namecheap', url: 'https://ap.www.namecheap.com' },
            { label: 'Webmail', url: 'https://host39.registrar-servers.com:2096' },
            { label: 'Stripe', url: 'https://dashboard.stripe.com' },
          ].map(({ label, url }) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="btn-ghost">{label} ↗</a>
          ))}
        </div>
      </div>

      {/* Expiring domains */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="card-title mb-0">Domains Expiring Soon (≤60 days)</div>
          <button onClick={() => go('domains')} className="text-xs text-teal hover:underline">View all →</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted text-xs border-b border-border">
              <th className="pb-2 font-medium">Domain</th>
              <th className="pb-2 font-medium">Expires</th>
              <th className="pb-2 font-medium">Days Left</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {expiringSoon.map(d => {
              const days = daysLeft(d.e);
              return (
                <tr key={d.n} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                  <td className="py-2 font-medium">{d.n}</td>
                  <td className={`py-2 ${urgencyClass(days)}`}>{fmtDate(d.e)}</td>
                  <td className={`py-2 font-mono ${urgencyClass(days)}`}>{days}d</td>
                  <td className="py-2">
                    {d.s === 'alert'
                      ? <span className="badge-red">⚠️ ALERT</span>
                      : <span className="badge-green">✓ Active</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
