import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api, ls } from '../api.js';

function ProgressBar({ value, label, color = 'teal' }) {
  const pct = Math.min(100, Math.max(0, value));
  const colorClass = pct > 80 ? 'bg-danger' : pct > 60 ? 'bg-yellow-500' : `bg-${color}`;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-surface2 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ServerHealth() {
  const { state } = useApp();
  const [health, setHealth] = useState({ cpu: 0, memory: { used: 0 }, disk: { used: 0 }, accounts: 0, configured: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, [state.serverOnline]);

  async function loadHealth() {
    setLoading(true);
    setError(null);
    try {
      if (state.serverOnline) {
        const data = await api.get('/api/whm/health');
        setHealth(data);
        ls.set('server_health', data);
      } else {
        const cached = ls.get('server_health', null);
        if (cached) setHealth(cached);
      }
    } catch (e) {
      setError(e.message);
      const cached = ls.get('server_health', null);
      if (cached) setHealth(cached);
    } finally {
      setLoading(false);
    }
  }

  function formatUptime(seconds) {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }

  return (
    <div className="panel-scroll">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">🖥️ Server Health</h1>
          <p className="text-muted text-sm mt-0.5">{health.hostname || 'host39.registrar-servers.com'}</p>
        </div>
        <button onClick={loadHealth} disabled={loading} className="btn-ghost">
          {loading ? '…' : '🔄'}
        </button>
      </div>

      {!health.configured && (
        <div className="card mb-6 border border-yellow-500/30 bg-yellow-500/10">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-medium text-yellow-400">WHM Not Connected</div>
              <p className="text-sm text-muted mt-1">
                Add WHM_TOKEN to your .env file to enable server monitoring.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="card mb-6 border border-red-500/30 bg-red-500/10">
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      )}

      {/* Resource Usage */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h3 className="text-sm font-medium mb-4">CPU</h3>
          <ProgressBar value={health.cpu} label="Load" />
        </div>
        <div className="card">
          <h3 className="text-sm font-medium mb-4">Memory</h3>
          <ProgressBar value={health.memory?.used || 0} label="Used" />
        </div>
      </div>

      {/* Disk */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Disk</h3>
          <span className="text-xs text-muted">{health.disk?.used || 0}% used</span>
        </div>
        <ProgressBar value={health.disk?.used || 0} label="Storage" color="blue" />
        <div className="flex justify-between text-xs text-muted mt-2">
          <span>{health.disk?.free || 0} GB free</span>
          <span>{health.disk?.total || 0} GB total</span>
        </div>
      </div>

      {/* Server Info */}
      <div className="card">
        <h3 className="text-sm font-medium mb-4">Server Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-surface2 rounded-lg">
            <div className="text-xs text-muted">IP Address</div>
            <div className="font-mono text-sm">{health.ip || '68.65.122.213'}</div>
          </div>
          <div className="p-3 bg-surface2 rounded-lg">
            <div className="text-xs text-muted">Accounts</div>
            <div className="font-mono text-sm">{health.accounts || 0}</div>
          </div>
          <div className="p-3 bg-surface2 rounded-lg">
            <div className="text-xs text-muted">Uptime</div>
            <div className="font-mono text-sm">{formatUptime(health.uptime)}</div>
          </div>
          <div className="p-3 bg-surface2 rounded-lg">
            <div className="text-xs text-muted">OS</div>
            <div className="font-mono text-sm">{health.os || 'CloudLinux'}</div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-6 flex gap-3">
        <a
          href="https://host39.registrar-servers.com:2087"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex-1 text-center"
        >
          Open WHM →
        </a>
        <a
          href="https://host39.registrar-servers.com:2083"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost flex-1 text-center"
        >
          Open cPanel →
        </a>
      </div>
    </div>
  );
}
