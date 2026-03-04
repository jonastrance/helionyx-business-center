import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api, ls } from '../api.js';

export default function WHMCS() {
  const { state } = useApp();
  const [stats, setStats] = useState({ clients: 0, tickets: 0, unpaidInvoices: 0, recentOrders: [], configured: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [state.serverOnline]);

  async function loadStats() {
    setLoading(true);
    setError(null);
    try {
      if (state.serverOnline) {
        const data = await api.get('/api/whmcs/stats');
        setStats(data);
        ls.set('whmcs_stats', data);
      } else {
        const cached = ls.get('whmcs_stats', null);
        if (cached) setStats(cached);
      }
    } catch (e) {
      setError(e.message);
      const cached = ls.get('whmcs_stats', null);
      if (cached) setStats(cached);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Active Clients', value: stats.clients, icon: '👥', color: 'text-blue-400' },
    { label: 'Open Tickets', value: stats.tickets, icon: '🎫', color: 'text-yellow-400' },
    { label: 'Unpaid Invoices', value: stats.unpaidInvoices, icon: '📄', color: stats.unpaidInvoices > 0 ? 'text-red-400' : 'text-muted' },
  ];

  return (
    <div className="panel-scroll">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">🛒 WHMCS</h1>
          <p className="text-muted text-sm mt-0.5">Your hosting business at a glance</p>
        </div>
        <button onClick={loadStats} disabled={loading} className="btn-ghost">
          {loading ? '…' : '🔄'}
        </button>
      </div>

      {!stats.configured && (
        <div className="card mb-6 border border-yellow-500/30 bg-yellow-500/10">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-medium text-yellow-400">WHMCS Not Connected</div>
              <p className="text-sm text-muted mt-1">
                Add WHMCS_IDENTIFIER and WHMCS_SECRET to your .env file to enable live data.
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

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {statCards.map(card => (
          <div key={card.label} className="card">
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-muted mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <h2 className="font-medium mb-4">Recent Orders</h2>
        {stats.recentOrders.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <div className="text-4xl mb-2">📦</div>
            <div>No orders yet</div>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-surface2 rounded-lg">
                <div>
                  <div className="font-medium">Order #{order.orderId}</div>
                  <div className="text-xs text-muted">{order.date}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${order.amount}</div>
                  <span className="text-xs px-2 py-0.5 rounded bg-success/20 text-success">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="mt-6 flex gap-3">
        <a
          href="https://helionyxcommons.com/admin"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex-1 text-center"
        >
          Open WHMCS Admin →
        </a>
      </div>
    </div>
  );
}
