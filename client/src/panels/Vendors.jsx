const VENDORS = [
  {
    section: '💳 Active Subscriptions',
    items: [
      { name: 'Namecheap Reseller (Nebula)', detail: 'Hosting plan — expires Mar 19, 2026 — AUTO-RENEW OFF', url: 'https://ap.www.namecheap.com', status: 'danger', cost: '~$19/mo' },
      { name: 'WHMCS Starter License', detail: 'Up to 250 clients', url: 'https://helionyxcommons.com/admin', status: 'ok', cost: '~$15/mo' },
      { name: 'Namecheap Domain Portfolio', detail: '73 domains — all auto-renew ON', url: 'https://ap.www.namecheap.com/domains/list/', status: 'ok', cost: '~$10/yr each' },
    ],
  },
  {
    section: '🆓 Free Tools',
    items: [
      { name: 'Cloudflare',  detail: 'DNS / CDN / Security — not yet set up', url: 'https://cloudflare.com', status: 'pending' },
      { name: 'Stripe',      detail: 'Payment processing — not yet configured in WHMCS', url: 'https://dashboard.stripe.com', status: 'pending' },
      { name: 'Termly.io',   detail: 'ToS + Privacy Policy generator', url: 'https://termly.io', status: 'pending' },
      { name: 'Postmark',    detail: 'Transactional email — free tier 100/mo', url: 'https://postmarkapp.com', status: 'pending' },
      { name: 'Uptime Robot', detail: 'Free server uptime monitoring', url: 'https://uptimerobot.com', status: 'pending' },
    ],
  },
  {
    section: '⚙️ Dev & Local Tools',
    items: [
      { name: 'Ollama',       detail: 'Local AI — powers Abbot when offline', url: 'https://ollama.ai', status: 'ok' },
      { name: 'Node.js v22',  detail: 'JavaScript runtime — Business Center backend', url: 'https://nodejs.org', status: 'ok' },
      { name: 'PostgreSQL',   detail: 'Database — install locally to persist Business Center data', url: 'https://postgresql.org', status: 'pending' },
      { name: 'VS Code',      detail: 'Primary editor', url: 'https://code.visualstudio.com', status: 'ok' },
    ],
  },
  {
    section: '🚀 Future / Planned',
    items: [
      { name: 'PayPal Business',   detail: 'Backup payment gateway for WHMCS' },
      { name: 'MaxMind',           detail: 'Fraud protection for WHMCS orders' },
      { name: 'Hetzner / DO',      detail: 'VPS options when you scale beyond shared hosting' },
      { name: 'SendGrid / Postfix',detail: 'SMTP for WHMCS email delivery' },
    ],
  },
];

const STATUS = {
  ok:      { cls: 'badge-green',  label: '✓ Active' },
  danger:  { cls: 'badge-red',    label: '⚠️ Attention' },
  pending: { cls: 'badge-muted',  label: 'Not set up' },
};

export default function Vendors() {
  return (
    <div className="panel-scroll">
      <h1 className="text-xl font-semibold mb-6">🛒 Vendors & Tools</h1>
      {VENDORS.map(group => (
        <div key={group.section} className="card mb-4">
          <div className="card-title">{group.section}</div>
          <div className="space-y-3">
            {group.items.map(item => (
              <div key={item.name} className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface2 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-white">{item.name}</span>
                    {item.status && <span className={STATUS[item.status]?.cls}>{STATUS[item.status]?.label}</span>}
                    {item.cost && <span className="text-xs text-muted">{item.cost}</span>}
                  </div>
                  <div className="text-xs text-muted mt-0.5">{item.detail}</div>
                </div>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer"
                     className="btn-ghost text-xs py-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    Open ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
