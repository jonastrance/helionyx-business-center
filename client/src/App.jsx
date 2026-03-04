import { useApp } from './context/AppContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Overview from './panels/Overview.jsx';
import Tasks from './panels/Tasks.jsx';
import Domains from './panels/Domains.jsx';
import Abbot from './panels/Abbot.jsx';
import Thoughts from './panels/Thoughts.jsx';
import Projects from './panels/Projects.jsx';
import Vendors from './panels/Vendors.jsx';
import Bible from './panels/Bible.jsx';
import BusinessSetup from './panels/BusinessSetup.jsx';
import WHMCS from './panels/WHMCS.jsx';
import Finance from './panels/Finance.jsx';
import ServerHealth from './panels/ServerHealth.jsx';
import Uptime from './panels/Uptime.jsx';
import SSL from './panels/SSL.jsx';
import Settings from './panels/Settings.jsx';

const PANELS = {
  overview:  Overview,
  tasks:     Tasks,
  domains:   Domains,
  abbot:     Abbot,
  thoughts:  Thoughts,
  projects:  Projects,
  vendors:   Vendors,
  bible:     Bible,
  setup:     BusinessSetup,
  whmcs:     WHMCS,
  finance:   Finance,
  server:    ServerHealth,
  uptime:    Uptime,
  ssl:       SSL,
  settings:  Settings,
};

export default function App() {
  const { state } = useApp();
  const Panel = PANELS[state.activePanel] || Overview;

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-white font-sans">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        <Panel />
      </main>
    </div>
  );
}
