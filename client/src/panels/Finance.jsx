import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api, ls } from '../api.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CATEGORIES = ['hosting', 'domain', 'software', 'marketing', 'services', 'other'];

export default function Finance() {
  const { state } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [mrr, setMrr] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'income', amount: '', description: '', category: '', source: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [state.serverOnline]);

  async function loadData() {
    setLoading(true);
    try {
      if (state.serverOnline) {
        const [transData, mrrData, chartData] = await Promise.all([
          api.get('/api/finance/transactions').catch(() => []),
          api.get('/api/finance/mrr').catch(() => ({ mrr: 0, trend: [] })),
          api.get('/api/finance/chart').catch(() => [])
        ]);
        setTransactions(transData);
        setMrr(mrrData.mrr);
        setChartData(chartData);
        ls.set('finance_transactions', transData);
        ls.set('finance_mrr', mrrData.mrr);
        ls.set('finance_chart', chartData);
      } else {
        setTransactions(ls.get('finance_transactions', []));
        setMrr(ls.get('finance_mrr', 0));
        setChartData(ls.get('finance_chart', []));
      }
    } catch (e) {
      setTransactions(ls.get('finance_transactions', []));
    } finally {
      setLoading(false);
    }
  }

  async function saveTransaction() {
    if (!form.amount) return;
    setSaving(true);
    try {
      const data = { ...form, amount: parseFloat(form.amount) };
      if (state.serverOnline) {
        const saved = await api.post('/api/finance/transactions', data);
        setTransactions(prev => [saved, ...prev]);
      } else {
        const saved = { ...data, id: Date.now(), date: new Date().toISOString().split('T')[0] };
        setTransactions(prev => [saved, ...prev]);
        ls.set('finance_transactions', [saved, ...transactions]);
      }
      setForm({ type: 'income', amount: '', description: '', category: '', source: '' });
      setShowForm(false);
      loadData(); // Refresh stats
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTrans(id) {
    try {
      if (state.serverOnline) {
        await api.delete(`/api/finance/transactions/${id}`);
      }
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="panel-scroll">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">💰 Finance</h1>
          <p className="text-muted text-sm mt-0.5">Track revenue and expenses</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '✕' : '+ Add'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card mb-6 border border-teal/30">
          <h3 className="font-medium mb-4">Add Transaction</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select
              value={form.type}
              onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
              className="input"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Amount"
              className="input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              className="input"
            />
            <select
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="input"
            >
              <option value="">Category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.source}
              onChange={e => setForm(prev => ({ ...prev, source: e.target.value }))}
              placeholder="Source (optional)"
              className="input flex-1"
            />
            <button onClick={saveTransaction} disabled={saving} className="btn-primary">
              {saving ? '…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="text-xs text-muted mb-1">MRR</div>
          <div className="text-2xl font-bold text-success">${mrr.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted mb-1">Total Income</div>
          <div className="text-2xl font-bold text-success">${totalIncome.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted mb-1">Total Expenses</div>
          <div className="text-2xl font-bold text-danger">${totalExpense.toFixed(2)}</div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-sm font-medium mb-4">Monthly P&L</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expense" fill="#ef4444" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transactions */}
      <div className="card">
        <h3 className="font-medium mb-4">Transactions</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <div className="text-4xl mb-2">💸</div>
            <div>No transactions yet</div>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-surface2 rounded group">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${t.type === 'income' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                      {t.type}
                    </span>
                    <span className="font-medium">{t.description || 'No description'}</span>
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {t.category && <span className="mr-2">{t.category}</span>}
                    <span>{t.date}</span>
                    {t.source && <span> • {t.source}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-medium ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                    {t.type === 'income' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)}
                  </span>
                  <button onClick={() => deleteTrans(t.id)} className="btn-danger text-xs py-1 px-2 opacity-0 group-hover:opacity-100">
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
