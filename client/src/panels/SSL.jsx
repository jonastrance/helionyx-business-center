import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api, ls } from '../api.js';

export default function SSL() {
  const { state } = useApp();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  useEffect(() => {
    loadCerts();
  }, [state.serverOnline]);

  async function loadCerts() {
    setLoading(true);
    try {
      if (state.serverOnline) {
        const data = await api.get('/api/ssl/certs');
        setCerts(data);
        ls.set('ssl_certs', data);
      } else {
        const cached = ls.get('ssl_certs', []);
        setCerts(cached);
      }
    } catch (e) {
      const cached = ls.get('ssl_certs', []);
      setCerts(cached);
    } finally {
      setLoading(false);
    }
  }

  async function addDomain() {
    if (!newDomain.trim()) return;
    setAdding(true);
    try {
      if (state.serverOnline) {
        const result = await api.post('/api/ssl/certs', { domain: newDomain.trim() });
        setCerts(prev => {
          const existing = prev.findIndex(c => c.domain === newDomain.trim());
          let updated;
          if (existing >= 0) {
            updated = [...prev];
            updated[existing] = result;
          } else {
            updated = [result, ...prev];
          }
          ls.set('ssl_certs', updated);
          return updated;
        });
      } else {
        // Offline: add to local list
        const newCert = { id: Date.now(), domain: newDomain.trim(), status: 'unknown' };
        setCerts(prev => {
          const updated = [newCert, ...prev];
          ls.set('ssl_certs', updated);
          return updated;
        });
      }
      setNewDomain('');
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  }

  async function checkCert(domain) {
    try {
      if (state.serverOnline) {
        const result = await api.post(`/api/ssl/check/${domain}`);
        setCerts(prev => prev.map(c => c.domain === domain ? { ...c, ...result } : c));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteCert(id) {
    try {
      if (state.serverOnline) {
        await api.delete(`/api/ssl/certs/${id}`);
      }
      setCerts(prev => {
        const updated = prev.filter(c => c.id !== id);
        ls.set('ssl_certs', updated);
        return updated;
      });
    } catch (e) {
      console.error(e);
    }
  }

  function getStatusBadge(status) {
    const styles = {
      valid: 'bg-success/20 text-success',
      expiring: 'bg-yellow-500/20 text-yellow-400',
      expired: 'bg-danger/20 text-danger',
      error: 'bg-red-500/20 text-danger',
      unknown: 'bg-muted/20 text-muted',
    };
    const labels = {
      valid: '✓ Valid',
      expiring: '⚠ Expiring',
      expired: '✕ Expired',
      error: '✕ Error',
      unknown: '? Unknown',
    };
    return <span className={`text-xs px-2 py-0.5 rounded ${styles[status] || styles.unknown}`}>{labels[status] || status}</span>;
  }

  return (
    <div className="panel-scroll">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">🔒 SSL Certificates</h1>
          <p className="text-muted text-sm mt-0.5">Monitor your domain SSL certificates</p>
        </div>
        <button onClick={loadCerts} disabled={loading} className="btn-ghost">
          {loading ? '…' : '🔄'}
        </button>
      </div>

      {/* Add Domain */}
      <div className="card mb-6">
        <h2 className="font-medium mb-4">Add Domain to Monitor</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addDomain(); }}
            placeholder="example.com"
            className="input flex-1"
          />
          <button onClick={addDomain} disabled={adding || !newDomain.trim()} className="btn-primary">
            {adding ? '…' : '+ Add'}
          </button>
        </div>
      </div>

      {/* Certificates List */}
      {certs.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">🔒</div>
          <div className="font-medium">No domains tracked</div>
          <div className="text-sm text-muted mt-1">Add a domain above to monitor its SSL certificate</div>
        </div>
      ) : (
        <div className="space-y-3">
          {certs.map(cert => (
            <div key={cert.id} className="card group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{cert.domain}</span>
                    {getStatusBadge(cert.status)}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {cert.issuer && <span>Issuer: {cert.issuer}</span>}
                    {cert.valid_to && <span> • Expires: {cert.valid_to}</span>}
                    {cert.error && <span className="text-danger"> • {cert.error}</span>}
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => checkCert(cert.domain)} className="btn-ghost text-xs py-1 px-2">
                    Check
                  </button>
                  <button onClick={() => deleteCert(cert.id)} className="btn-danger text-xs py-1 px-2">
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
