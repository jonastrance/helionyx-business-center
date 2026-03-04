import { useApp } from '../context/AppContext.jsx';

function BibleRow({ label, value, missing, missingPrompt }) {
  const { dispatch } = useApp();
  const goAbbot = (prompt) => {
    dispatch({ type: 'SET_PANEL', payload: 'abbot' });
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('abbot-inject', { detail: prompt }));
    }, 300);
  };

  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="text-xs text-muted w-40 flex-shrink-0 pt-0.5">{label}</div>
      {value ? (
        <div className="text-sm text-white">{value}</div>
      ) : (
        <button
          onClick={() => missingPrompt && goAbbot(missingPrompt)}
          className="text-sm text-warn/70 hover:text-warn transition-colors cursor-pointer text-left"
        >
          ⚠️ {missing || 'Not configured'} {missingPrompt ? '— click for help' : ''}
        </button>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card mb-4">
      <div className="card-title">{title}</div>
      {children}
    </div>
  );
}

export default function Bible() {
  return (
    <div className="panel-scroll">
      <h1 className="text-xl font-semibold mb-6">📖 Business Bible</h1>

      <Section title="Company">
        <BibleRow label="Legal Name"     value="Helionyx LLC" />
        <BibleRow label="Owner"          value="Ryan Mauldin (jonastrance)" />
        <BibleRow label="Personal Email" value="mauldinjonas@gmail.com" />
        <BibleRow label="Business Email" missing="Not configured" missingPrompt="What business email should I set up for Helionyx Commons and how?" />
        <BibleRow label="Business Address" missing="Not set" missingPrompt="What are my options for a business address for Helionyx LLC?" />
        <BibleRow label="Phone"          missing="Not set" missingPrompt="Should I get a VoIP business phone number for Helionyx LLC? What are good options?" />
        <BibleRow label="EIN"            missing="Not obtained" missingPrompt="How do I get an EIN for Helionyx LLC and do I need one right now?" />
      </Section>

      <Section title="Infrastructure">
        <BibleRow label="Hosting Plan"   value="Namecheap Reseller — Nebula" />
        <BibleRow label="Server"         value="host39.registrar-servers.com" />
        <BibleRow label="IP Address"     value="68.65.122.213" />
        <BibleRow label="Disk"           value="30 GB" />
        <BibleRow label="Bandwidth"      value="Unlimited" />
        <BibleRow label="WHMCS License"  value="Starter (up to 250 clients)" />
      </Section>

      <Section title="Helionyx Commons (Active Business Unit)">
        <BibleRow label="URL"            value="helionyxcommons.com" />
        <BibleRow label="Platform"       value="WHMCS Starter" />
        <BibleRow label="Status"         value="Live — accepting signups (no payment gateway yet)" />
        <BibleRow label="Plans"          value="Starter $3.99/mo · Pro $7.99/mo · Business $14.99/mo" />
        <BibleRow label="MRR"            value="$0 (no customers yet)" />
        <BibleRow label="Target"         value="$100 MRR → $500 MRR → $1k MRR" />
      </Section>

      <Section title="Admin Portals">
        {[
          { label: 'WHMCS Admin', url: 'helionyxcommons.com/admin', user: 'uraod' },
          { label: 'WHM',         url: 'host39.registrar-servers.com:2087', user: 'heliipvb' },
          { label: 'cPanel',      url: 'host39.registrar-servers.com:2083' },
          { label: 'Webmail',     url: 'host39.registrar-servers.com:2096', note: 'Roundcube' },
          { label: 'Namecheap',   url: 'ap.www.namecheap.com', user: 'jonastrance' },
        ].map(row => (
          <div key={row.label} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
            <div className="text-xs text-muted w-40 flex-shrink-0">{row.label}</div>
            <div className="flex-1 text-sm">
              <a href={`https://${row.url}`} target="_blank" rel="noreferrer"
                 className="text-teal hover:underline">{row.url}</a>
              {row.user && <span className="text-muted text-xs ml-2">user: {row.user}</span>}
              {row.note && <span className="text-muted text-xs ml-2">({row.note})</span>}
            </div>
          </div>
        ))}
      </Section>

      <Section title="Domain Portfolio">
        <BibleRow label="Total"     value="73 domains registered at Namecheap" />
        <BibleRow label="Auto-renew" value="ON for all domains" />
        <BibleRow label="Purposes"  missing="Not yet assigned" missingPrompt="Let's go through my 73 domains and assign purposes or ideas to each one. Start with the first 10." />
        <BibleRow label="⚠️ Alert" value="jonastrance.com — expires Mar 17, 2026 — renew immediately!" />
      </Section>

      <Section title="Missing / To Define">
        {[
          { label: 'Business vision',   prompt: 'Help me define a 1-2 year vision for Helionyx LLC.' },
          { label: '2nd business unit', prompt: 'What should my second Helionyx business unit be? Let\'s brainstorm options based on my domain portfolio.' },
          { label: 'Marketing plan',    prompt: 'Help me create a simple marketing plan for Helionyx Commons to get my first 10 customers.' },
          { label: 'Expense tracking',  prompt: 'What\'s the simplest way to track business expenses for Helionyx LLC as a solo operator?' },
        ].map(item => (
          <BibleRow key={item.label} label={item.label} missing="Not defined" missingPrompt={item.prompt} />
        ))}
      </Section>
    </div>
  );
}
