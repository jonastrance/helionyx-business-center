import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { api, ls } from '../api.js';

const SYSTEM = `You are Abbot — the embedded AI advisor for Helionyx LLC, owned by Ryan Mauldin.

COMPANY: Helionyx LLC (multi-vertical) | OWNER: Ryan (jonastrance) | EMAIL: mauldinjonas@gmail.com
ACTIVE BUSINESS: Helionyx Commons — web hosting reseller at helionyxcommons.com
PLATFORM: WHMCS Starter on Namecheap Reseller Hosting (Nebula)
SERVER: host39.registrar-servers.com (68.65.122.213), 30GB disk
PLANS: Starter $3.99/mo, Pro $7.99/mo, Business $14.99/mo

CRITICAL RIGHT NOW:
1. jonastrance.com — expires Mar 17, 2026 — RENEW IMMEDIATELY
2. Hosting — expires Mar 19, 2026 — AUTO-RENEW IS OFF
3. No payment gateway — Stripe or PayPal needed in WHMCS before first customer
4. No ToS or Privacy Policy — required for Stripe/PayPal

TODO (priority): payment gateway → company contact → logo → ToS/PP → TLD pricing → end-to-end test
DOMAIN PORTFOLIO: 73 domains at Namecheap
REVENUE: $0 MRR | Goal: first customer → $100 MRR → $500 MRR → $1k MRR

Be direct and concise. Give numbered steps for technical tasks. Flag urgency clearly.`;

const PROVIDERS_CONFIG = {
  ollama:    { label: 'Ollama',    icon: '🦙', local: true,  note: 'Local model — free & private' },
  anthropic: { label: 'Anthropic', icon: '🟣', local: false, note: 'Add ANTHROPIC_API_KEY to .env' },
  openai:    { label: 'OpenAI',    icon: '🟢', local: false, note: 'Add OPENAI_API_KEY to .env' },
  minimax:   { label: 'MiniMax',   icon: '🔵', local: false, note: 'Add MINIMAX_API_KEY to .env' },
};

function fmt(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-surface2 px-1 rounded text-teal text-xs">$1</code>')
    .replace(/\n/g, '<br>');
}

export default function Abbot() {
  const { state } = useApp();
  const [provider, setProvider]   = useState('ollama');
  const [model, setModel]         = useState('');
  const [models, setModels]       = useState([]);
  const [ollamaOk, setOllamaOk]   = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [sending, setSending]     = useState(false);
  const [inited, setInited]       = useState(false);
  const chatRef = useRef(null);

  // Check Ollama
  const checkOllama = useCallback(async () => {
    try {
      const r = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(3000) });
      if (r.ok) {
        const d = await r.json();
        const names = (d.models || []).map(m => m.name);
        setOllamaOk(true);
        setModels(names);
        if (!model && names.length > 0) setModel(names[0]);
      }
    } catch {
      setOllamaOk(false);
      setModels([]);
    }
  }, [model]);

  useEffect(() => {
    checkOllama();
    const iv = setInterval(checkOllama, 30000);
    return () => clearInterval(iv);
  }, [checkOllama]);

  // Load history from localStorage (or server if available)
  useEffect(() => {
    if (inited) return;
    setInited(true);
    const saved = ls.get('abbot_history', []);
    if (saved.length > 0) {
      setMessages(saved);
    } else {
      const welcome = {
        role: 'assistant',
        content: buildWelcome(),
        ts: Date.now(),
      };
      setMessages([welcome]);
    }
  }, [inited]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
    if (messages.length > 0) ls.set('abbot_history', messages.slice(-60));
  }, [messages]);

  // Listen for abbot-inject events from Thoughts panel
  useEffect(() => {
    function handleInject(e) {
      setInput(e.detail);
      // Focus the input after a brief delay to let the UI render
      setTimeout(() => {
        const textarea = document.querySelector('.abbot-input');
        if (textarea) textarea.focus();
      }, 100);
    }
    window.addEventListener('abbot-inject', handleInject);
    return () => window.removeEventListener('abbot-inject', handleInject);
  }, []);

  function buildWelcome() {
    const j = Math.ceil((new Date('2026-03-17') - new Date()) / 86400000);
    const h = Math.ceil((new Date('2026-03-19') - new Date()) / 86400000);
    return `Hey Ryan! I'm **Abbot** — your Helionyx business advisor.\n\n**2 critical items right now:**\n\n🚨 **jonastrance.com expires in ${j} days** — it's in Alert status. Renew at Namecheap immediately.\n⚠️ **Hosting expires in ${h} days** — auto-renew is OFF. Must renew before Mar 19.\n\n**Your #1 business blocker:**\n💳 **Payment gateway** — you can't accept money until Stripe or PayPal is set up in WHMCS.\n\nWhat do you want to tackle first?`;
  }

  async function send() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');

    const userMsg = { role: 'user', content: text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      if (provider === 'ollama') {
        await sendOllama(text);
      } else {
        await sendRemote(provider, text);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${e.message}`, ts: Date.now() }]);
    } finally {
      setSending(false);
    }
  }

  async function sendOllama(text) {
    if (!ollamaOk || !model) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Ollama is not running. Start Ollama and select a model to chat.',
        ts: Date.now(),
      }]);
      return;
    }

    const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
    const r = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: SYSTEM }, ...history, { role: 'user', content: text }],
        stream: true,
      }),
    });
    if (!r.ok) throw new Error(`Ollama HTTP ${r.status}`);

    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let full = '';
    const msgId = Date.now();

    setMessages(prev => [...prev, { role: 'assistant', content: '', ts: msgId, streaming: true }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of dec.decode(value).split('\n').filter(l => l.trim())) {
        try {
          const obj = JSON.parse(line);
          if (obj.message?.content) {
            full += obj.message.content;
            setMessages(prev => prev.map(m => m.ts === msgId ? { ...m, content: full } : m));
          }
        } catch {}
      }
    }
    setMessages(prev => prev.map(m => m.ts === msgId ? { ...m, streaming: false } : m));
  }

  async function sendRemote(prov, text) {
    const cfg = PROVIDERS_CONFIG[prov];
    if (!state.providers[prov]) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚙️ **${cfg.label} not configured**\n\nTo enable: add \`${prov.toUpperCase()}_API_KEY\` to your \`.env\` file and restart the server.\n\n_${cfg.note}_`,
        ts: Date.now(),
      }]);
      return;
    }

    const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

    let body, response;
    if (prov === 'anthropic') {
      body = { model: 'claude-sonnet-4-5-20250929', max_tokens: 2048, system: SYSTEM, messages: [...history, { role: 'user', content: text }] };
      response = await api.post('/api/ai/anthropic', body);
      const content = response?.content?.[0]?.text || '(no response)';
      setMessages(prev => [...prev, { role: 'assistant', content, ts: Date.now() }]);
    } else if (prov === 'openai') {
      body = { model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM }, ...history, { role: 'user', content: text }] };
      response = await api.post('/api/ai/openai', body);
      const content = response?.choices?.[0]?.message?.content || '(no response)';
      setMessages(prev => [...prev, { role: 'assistant', content, ts: Date.now() }]);
    } else if (prov === 'minimax') {
      body = { model: 'MiniMax-Text-01', messages: [{ role: 'system', content: SYSTEM }, ...history, { role: 'user', content: text }] };
      response = await api.post('/api/ai/minimax', body);
      const content = response?.choices?.[0]?.message?.content || '(no response)';
      setMessages(prev => [...prev, { role: 'assistant', content, ts: Date.now() }]);
    }
  }

  function clearChat() {
    ls.del('abbot_history');
    setMessages([{ role: 'assistant', content: buildWelcome(), ts: Date.now() }]);
  }

  const providerAvailable = (p) => {
    if (p === 'ollama') return ollamaOk;
    return state.serverOnline; // shows as available when server is running (will show config message if no key)
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold">🤖 Abbot</h1>
            <p className="text-xs text-muted">Your Helionyx business AI</p>
          </div>
          <button onClick={clearChat} className="btn-ghost text-xs">Clear Chat</button>
        </div>

        {/* Provider selector */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(PROVIDERS_CONFIG).map(([key, cfg]) => {
            const active = provider === key;
            const avail  = key === 'ollama' ? ollamaOk : state.providers[key];
            return (
              <button
                key={key}
                onClick={() => setProvider(key)}
                title={cfg.note}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                  ${active
                    ? 'border-teal bg-teal/10 text-teal'
                    : avail
                      ? 'border-border text-muted hover:border-teal/50 hover:text-white'
                      : 'border-border/50 text-muted/50 cursor-pointer'}`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                {key === 'ollama' && (
                  <span className={`w-1.5 h-1.5 rounded-full ${ollamaOk ? 'bg-success' : 'bg-muted'}`} />
                )}
                {key !== 'ollama' && avail && (
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                )}
                {key !== 'ollama' && !avail && (
                  <span className="text-muted/50 text-xs">🔑</span>
                )}
              </button>
            );
          })}

          {/* Model selector (Ollama only) */}
          {provider === 'ollama' && models.length > 0 && (
            <select value={model} onChange={e => setModel(e.target.value)}
                    className="select ml-auto text-xs py-1.5">
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${msg.role === 'user'
                ? 'bg-teal text-bg font-medium rounded-br-sm'
                : 'bg-surface2 border border-border rounded-bl-sm'}`}>
              {msg.role === 'assistant' ? (
                <div>
                  <div className="text-xs text-muted mb-1 font-medium">🤖 Abbot</div>
                  <div dangerouslySetInnerHTML={{ __html: fmt(msg.content) }} />
                  {msg.streaming && (
                    <div className="flex gap-1 mt-2">
                      {[0,1,2].map(n => (
                        <div key={n} className="typing-dot" style={{ animationDelay: `${n * 0.2}s` }} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>{msg.content}</div>
              )}
            </div>
          </div>
        ))}
        {sending && !messages[messages.length-1]?.streaming && (
          <div className="flex justify-start fade-in">
            <div className="bg-surface2 border border-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="text-xs text-muted mb-1">🤖 Abbot</div>
              <div className="flex gap-1">
                {[0,1,2].map(n => (
                  <div key={n} className="typing-dot" style={{ animationDelay: `${n * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-border">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask Abbot anything… (Enter to send, Shift+Enter for newline)`}
            rows={2}
            className="input flex-1 resize-none abbot-input"
            disabled={sending}
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="btn-primary px-4 self-end disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? '…' : '↑'}
          </button>
        </div>
      </div>
    </div>
  );
}
