import { useApp } from '../context/AppContext.jsx';
import { DOMAINS } from '../data/domains.js';

const daysLeft = (d) => {
  const x = new Date(d); x.setHours(0,0,0,0);
  const t = new Date(); t.setHours(0,0,0,0);
  return Math.ceil((x - t) / 86400000);
};

const urgentCount = DOMAINS.filter(d => daysLeft(d.e) <= 30).length;

const NAV = [
  { id: 'overview',  icon: '🏠', label: 'Overview' },
  { id: 'tasks',     icon: '✅', label: 'Tasks' },
  { id: 'domains',   icon: '🌐', label: 'Domains', badge: urgentCount > 0 ? urgentCount : null },
  { sep: 'Business' },
  { id: 'whmcs',     icon: '💳', label: 'WHMCS' },
  { id: 'finance',   icon: '💰', label: 'Finance' },
  { id: 'vendors',   icon: '🛒', label: 'Vendors' },
  { id: 'bible',     icon: '📖', label: 'Business Bible' },
  { id: 'setup',     icon: '⚙️', label: 'Business Setup' },
  { sep: 'Infrastructure' },
  { id: 'server',    icon: '🖥️', label: 'Server Health' },
  { id: 'uptime',    icon: '📈', label: 'Uptime' },
  { id: 'ssl',       icon: '🔒', label: 'SSL' },
  { sep: 'Tools' },
  { id: 'abbot',     icon: '🤖', label: 'Abbot AI' },
  { id: 'thoughts',  icon: '💬', label: 'Thoughts' },
  { id: 'projects',  icon: '📁', label: 'Projects' },
  { sep: 'System' },
  { id: 'settings',  icon: '⚙️', label: 'Settings' },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();

  const go = (id) => dispatch({ type: 'SET_PANEL', payload: id });

  return (
    <aside className="w-56 flex-shrink-0 bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="text-teal font-bold text-sm tracking-wide">⚡ Helionyx</div>
        <div className="text-muted text-xs uppercase tracking-widest mt-0.5">Business Center</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map((item, i) => {
          if (item.sep) return (
            <div key={i} className="text-muted text-xs uppercase tracking-widest px-2 pt-4 pb-1">
              {item.sep}
            </div>
          );
          const active = state.activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all text-left
                ${active
                  ? 'bg-teal/10 text-teal'
                  : 'text-muted hover:text-white hover:bg-surface2'}`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-danger text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer — server status */}
      <div className="border-t border-border px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${state.serverOnline ? 'bg-success' : 'bg-muted'}`} />
          <span className={state.serverOnline ? 'text-success' : 'text-muted'}>
            {state.serverOnline ? 'Server Online' : 'Offline Mode'}
          </span>
        </div>
        {state.serverOnline && (
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${state.dbOnline ? 'bg-sky' : 'bg-muted'}`} />
            <span className={state.dbOnline ? 'text-sky' : 'text-muted'}>
              {state.dbOnline ? 'PostgreSQL' : 'No DB'}
            </span>
          </div>
        )}
        <div className="text-muted mt-2 opacity-50">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </aside>
  );
}
