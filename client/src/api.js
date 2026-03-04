const BASE = import.meta.env.DEV ? '' : '';  // proxied via Vite in dev

export async function apiFetch(method, path, body) {
  try {
    const r = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: r.statusText }));
      throw new Error(err.error || r.statusText);
    }
    return await r.json();
  } catch (e) {
    if (e.name === 'TimeoutError') throw new Error('Server not responding');
    throw e;
  }
}

export const api = {
  get:    (path)        => apiFetch('GET',    path),
  post:   (path, body)  => apiFetch('POST',   path, body),
  put:    (path, body)  => apiFetch('PUT',    path, body),
  delete: (path)        => apiFetch('DELETE', path),
};

// localStorage fallback helpers
export const ls = {
  get:  (key, def = null) => { try { return JSON.parse(localStorage.getItem('hx4_' + key)) ?? def; } catch { return def; } },
  set:  (key, val)        => { try { localStorage.setItem('hx4_' + key, JSON.stringify(val)); } catch {} },
  del:  (key)             => localStorage.removeItem('hx4_' + key),
};
