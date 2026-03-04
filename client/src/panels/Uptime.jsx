import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api, ls } from '../api.js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Uptime() {
  const { state } = useApp();
  const [stats, setStats] = useState({ uptime: 0, avgResponse: 0 });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [state.serverOnline]);

  // Auto-check on mount if server is online
  useEffect(() => {
    if (!loading && state.serverOnline) {
      checkNow();
    }
  }, [loading, state.serverOnline]);

  async function loadData() {
    setLoading(true);
    try {
      if (state.serverOnline) {
        const [statsData, logsData] = await Promise.all([
          api.get('/api/uptime/stats').catch(() => ({})),
          api.get('/api/uptime/logs').catch(() => [])
        ]);
        setStats(statsData);
        setLogs(logsData.slice(0, 60)); // Last 60 checks for chart
        ls.set('uptime_stats', statsData);
        ls.set('uptime_logs', logsData);
      } else {
        const cachedStats = ls.get('uptime_stats', { uptime: 0, avgResponse: 0 });
        const cachedLogs = ls.get('uptime_logs', []);
        setStats(cachedStats);
        setLogs(cachedLogs.slice(0, 60));
      }
    } catch (e) {
      const cachedStats = ls.get('uptime_stats', { uptime: 0, avgResponse: 0 });
      const cachedLogs = ls.get('uptime_logs', []);
      setStats(cachedStats);
      setLogs(cachedLogs);
    } finally {
      setLoading(false);
    }
  }

  async function checkNow() {
    setChecking(true);
    try {
      if (state.serverOnline) {
        await api.post('/api/uptime/check', { target: 'helionyxcommons.com' });
        await loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  }

  const uptimeColor = stats.uptime >= 99 ? 'text-success' : stats.uptime >= 95 ? 'text-yellow-400' : 'text-danger';

  // Prepare chart data (reverse to show oldest first)
  const chartData = [...logs].reverse().map((log, i) => ({
    time: new Date(log.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    response: log.response_ms || 0,
    status: log.status,
  }));

  return (
    <div className="panel-scroll">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">📈 Uptime Monitor</h1>
          <p className="text-muted text-sm mt-0.5">helionyxcommons.com</p>
        </div>
        <button onClick={checkNow} disabled={checking} className="btn-ghost">
          {checking ? '…' : '🔄'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <div className={`text-3xl font-bold ${uptimeColor}`}>{stats.uptime || 0}%</div>
          <div className="text-xs text-muted mt-1">Uptime (24h)</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-teal">{stats.avgResponse || 0}ms</div>
          <div className="text-xs text-muted mt-1">Avg Response</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold">{stats.total || 0}</div>
          <div className="text-xs text-muted mt-1">Checks</div>
        </div>
      </div>

      {/* Sparkline */}
      {chartData.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-sm font-medium mb-4">Response Time (last {chartData.length} checks)</h3>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={40} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Line type="monotone" dataKey="response" stroke="#14b8a6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Checks */}
      <div className="card">
        <h3 className="text-sm font-medium mb-4">Recent Checks</h3>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <div className="text-4xl mb-2">📊</div>
            <div>No data yet</div>
            <div className="text-xs mt-1">Click refresh to run a check</div>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 10).map((log, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-surface2 rounded text-sm">
                <span className="text-muted">
                  {new Date(log.checked_at).toLocaleTimeString()}
                </span>
                <span className={`font-mono ${log.status >= 200 && log.status < 400 ? 'text-success' : 'text-danger'}`}>
                  {log.status || 'Error'}
                </span>
                <span className="text-muted">{log.response_ms}ms</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
