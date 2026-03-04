import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api, ls } from '../api.js';

export default function Settings() {
  const { state } = useApp();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [providerStatus, setProviderStatus] = useState({});

  // Load settings
  useEffect(() => {
    async function load() {
      if (state.serverOnline) {
        try {
          const [settingsData, providers] = await Promise.all([
            api.get('/api/settings'),
            api.get('/api/settings/providers/status').catch(() => ({}))
          ]);
          setSettings(settingsData);
          setProviderStatus(providers);
        } catch {}
      }
      setLoading(false);
    }
    load();
  }, [state.serverOnline]);

  async function saveSetting(key, value) {
    setSaving(key);
    try {
      if (state.serverOnline) {
        await api.put(`/api/settings/${key}`, { value });
      }
      setSettings(prev => ({ ...prev, [key]: value }));
      ls.set(`setting_${key}`, value);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  }

  const themes = [
    { id: 'dark', label: 'Dark', icon: '🌙' },
    { id: 'light', label: 'Light', icon: '☀️' },
    { id: 'system', label: 'System', icon: '💻' },
  ];

  const providers = [
    { id: 'anthropic', label: 'Anthropic (Claude)', icon: '🟣', key: 'ANTHROPIC_API_KEY', desc: 'Add to .env file' },
    { id: 'openai', label: 'OpenAI (GPT)', icon: '🟢', key: 'OPENAI_API_KEY', desc: 'Add to .env file' },
    { id: 'minimax', label: 'MiniMax', icon: '🔵', key: 'MINIMAX_API_KEY', desc: 'Add to .env file' },
    { id: 'whmcs', label: 'WHMCS', icon: '🛒', key: 'WHMCS credentials', desc: 'Add WHMCS_IDENTIFIER and WHMCS_SECRET to .env' },
    { id: 'whm', label: 'WHM API', icon: '🖥️', key: 'WHM token', desc: 'Add WHM_TOKEN to .env' },
  ];

  return (
    <div className="panel-scroll">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">⚙️ Settings</h1>
        <p className="text-muted text-sm mt-0.5">Configure your Business Center</p>
      </div>

      {/* Theme */}
      <div className="card mb-6">
        <h2 className="font-medium mb-4">Appearance</h2>
        <div className="flex gap-3">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => saveSetting('theme', t.id)}
              disabled={saving === 'theme'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
                ${settings.theme === t.id || (!settings.theme && t.id === 'dark')
                  ? 'border-teal bg-teal/10 text-teal'
                  : 'border-border text-muted hover:border-teal/50'}`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ollama */}
      <div className="card mb-6">
        <h2 className="font-medium mb-4">🦙 Ollama</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={settings.ollama_url || 'http://localhost:11434'}
            onChange={e => setSettings(prev => ({ ...prev, ollama_url: e.target.value }))}
            placeholder="http://localhost:11434"
            className="input flex-1"
          />
          <button
            onClick={() => saveSetting('ollama_url', settings.ollama_url)}
            disabled={saving === 'ollama_url'}
            className="btn-primary"
          >
            {saving === 'ollama_url' ? '…' : 'Save'}
          </button>
        </div>
        <p className="text-xs text-muted mt-2">
          {state.providers.ollama ? '✅ Ollama is running' : '⚠️ Ollama not detected - make sure it is running locally'}
        </p>
      </div>

      {/* API Providers */}
      <div className="card mb-6">
        <h2 className="font-medium mb-4">🔑 API Keys & Services</h2>
        <div className="space-y-3">
          {providers.map(p => {
            const isConfigured = providerStatus[p.id];
            return (
              <div key={p.id} className="flex items-center justify-between p-3 bg-surface2 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{p.label}</div>
                    <div className="text-xs text-muted">{p.desc}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${isConfigured ? 'bg-success/20 text-success' : 'bg-muted/20 text-muted'}`}>
                  {isConfigured ? '✅ Configured' : '❌ Not set'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Server Status */}
      <div className="card">
        <h2 className="font-medium mb-4">🖥️ Server Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-surface2 rounded-lg">
            <div className="text-xs text-muted">Server</div>
            <div className={`font-medium ${state.serverOnline ? 'text-success' : 'text-danger'}`}>
              {state.serverOnline ? '✅ Online' : '❌ Offline'}
            </div>
          </div>
          <div className="p-3 bg-surface2 rounded-lg">
            <div className="text-xs text-muted">Database</div>
            <div className={`font-medium ${state.dbOnline ? 'text-success' : 'text-danger'}`}>
              {state.dbOnline ? '✅ Connected' : '❌ Disconnected'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
