// Business Setup items organized by category
// required: true = must-have | optional: true = nice-to-have
// blocker: true = nothing works until this is done
// defaultDone: true = already completed

export const SETUP_CATEGORIES = [
  {
    id: 'legal',
    icon: '🏦',
    title: 'Legal & Financial',
    description: 'Business foundation — legal entity, tax IDs, banking',
    items: [
      { id: 'llc-formation',       label: 'LLC Formation',                   done: true,  desc: 'Helionyx LLC registered', required: true },
      { id: 'ein',                  label: 'EIN (Employer ID Number)',        done: false, desc: 'Free from IRS.gov — required for business banking and taxes', optional: true, optReqNote: 'Required for tax filings & banking' },
      { id: 'bank-account',         label: 'Business Checking Account',       done: false, desc: 'Separate business finances from personal — needed before you collect revenue', optional: true, optReqNote: 'Required before first payment' },
      { id: 'business-license',     label: 'Business License',                done: false, desc: 'Check your state/county requirements — may be required in Virginia', optional: true },
      { id: 'registered-agent',     label: 'Registered Agent',                done: false, desc: 'Required for LLC — may be satisfied by formation service', optional: true },
      { id: 'operating-agreement',  label: 'Operating Agreement',             done: false, desc: 'Documents LLC ownership and rules — recommended even as solo owner', optional: true },
    ],
  },
  {
    id: 'whmcs',
    icon: '🔧',
    title: 'WHMCS Configuration',
    description: 'Web hosting storefront setup at helionyxcommons.com',
    items: [
      { id: 'whmcs-general',   label: 'Company Name & General Settings',     done: true,  desc: 'Configured "Helionyx Commons"', required: true },
      { id: 'whmcs-cron',      label: 'WHMCS Cron Job',                       done: true,  desc: 'Fixed and running', required: true },
      { id: 'whmcs-opcache',   label: 'OPcache PHP Warning',                  done: true,  desc: 'Cleared via .user.ini', required: false },
      { id: 'whmcs-registrar', label: 'Namecheap Registrar API',              done: true,  desc: 'Configured in WHMCS', required: true },
      { id: 'whmcs-products',  label: 'Hosting Products (Starter/Pro/Biz)',   done: true,  desc: 'All three plans live with pricing', required: true },
      { id: 'whmcs-theme',     label: 'Custom Dark Navy Theme',               done: true,  desc: '"helionyx" template deployed', required: false },
      { id: 'whmcs-branding',  label: 'Portal Branding',                      done: true,  desc: 'helionyxcommons.com live with welcome, footer, titles', required: false },
      { id: 'whmcs-payment',   label: 'Payment Gateway (Stripe or PayPal)',   done: false, desc: 'BLOCKER — you cannot accept any money until this is configured', required: true, blocker: true },
      { id: 'whmcs-contact',   label: 'Company Email, Address, Phone',        done: false, desc: 'WHMCS → Setup → General Settings → Store tab', required: true },
      { id: 'whmcs-logo',      label: 'Logo Upload',                          done: false, desc: 'WHMCS → Setup → General Settings → Logo URL', required: false },
      { id: 'whmcs-tos',       label: 'Terms of Service & Privacy Policy',    done: false, desc: 'Required for Stripe/PayPal approval and legal compliance', required: true },
      { id: 'whmcs-smtp',      label: 'Email / SMTP Configuration',           done: false, desc: 'WHMCS → Setup → Email → Configure SMTP so invoices actually send', required: true },
      { id: 'whmcs-tld',       label: 'TLD Domain Pricing',                   done: false, desc: 'WHMCS → Setup → Products → Domain Pricing — set .com, .net, .org etc.', required: false },
      { id: 'whmcs-fraud',     label: 'Fraud Protection (MaxMind)',            done: false, desc: 'Protects against fraudulent orders — optional but recommended', optional: true },
      { id: 'whmcs-test',      label: 'End-to-End Signup Flow Test',          done: false, desc: 'Order a plan, pay, provision — verify the full customer journey', required: true },
    ],
  },
  {
    id: 'whm',
    icon: '🖥️',
    title: 'WHM Configuration',
    description: 'Server-level setup at host39.registrar-servers.com:2087',
    items: [
      { id: 'whm-active',      label: 'WHM Active',                          done: true,  desc: 'WHM running at host39.registrar-servers.com:2087', required: true },
      { id: 'whm-api-token',   label: 'WHM API Token',                       done: false, desc: 'WHM → Development → Manage API Tokens — needed for live server monitoring in this dashboard', required: false },
      { id: 'whm-nameservers', label: 'Custom Nameservers (ns1/ns2)',         done: false, desc: 'WHM → DNS → Nameserver Configuration — set ns1/ns2.helionyxcommons.com', optional: true },
      { id: 'whm-packages',    label: 'Hosting Packages in WHM',             done: false, desc: 'WHM → Packages → Add a Package — match your WHMCS plans', required: true },
      { id: 'whm-php',         label: 'PHP Version Configuration',            done: false, desc: 'WHM → MultiPHP Manager — ensure PHP 8.1+ is available and set as default', required: true },
      { id: 'whm-backup',      label: 'Backup Configuration',                 done: false, desc: 'WHM → Backup → Configure Backup — daily backups essential for a hosting business', required: true },
      { id: 'whm-mail',        label: 'SpamAssassin / Email Config',          done: false, desc: 'WHM → Email → Configure SpamAssassin', optional: true },
      { id: 'whm-test',        label: 'WHM → WHMCS Auto-Provision Test',     done: false, desc: 'Create a test cPanel account via WHMCS and verify it provisions correctly', required: true },
    ],
  },
  {
    id: 'cpanel',
    icon: '📁',
    title: 'cPanel Configuration',
    description: 'Customer-facing hosting environment setup',
    items: [
      { id: 'cpanel-theme',        label: 'Default cPanel Theme',              done: false, desc: 'WHM → Themes — set the cPanel theme your customers will see', required: false },
      { id: 'cpanel-features',     label: 'Feature Lists',                     done: false, desc: 'WHM → Packages → Feature Manager — control what customers can access per plan', required: true },
      { id: 'cpanel-php',          label: 'PHP Defaults per Account',          done: false, desc: 'Set PHP version and modules for new accounts', required: false },
      { id: 'cpanel-email-limits', label: 'Email Account Limits per Plan',     done: false, desc: 'Ensure email quotas match your plan descriptions', required: false },
      { id: 'cpanel-softaculous',  label: 'Enable Softaculous (App Installer)',done: false, desc: 'One-click WordPress/etc. installs — customers expect this', optional: true },
    ],
  },
  {
    id: 'growth',
    icon: '🚀',
    title: 'Growth & Infrastructure',
    description: 'Scaling, planning, and second-stage development',
    items: [
      { id: 'growth-vps-research',   label: 'VPS Research',                     done: false, desc: 'Compare: Namecheap VPS, Hetzner CX21, DigitalOcean Droplet — for when you outgrow shared hosting', optional: true },
      { id: 'growth-vps-threshold',  label: 'Migration Threshold Decision',     done: false, desc: 'Decide: at X customers/GB → migrate to VPS. Typical trigger: 10+ accounts or performance issues', optional: true },
      { id: 'growth-vps-budget',     label: 'VPS Budget Planning',              done: false, desc: 'Budget $5-20/mo for VPS vs current $0/mo (prepaid) — factor into pricing strategy', optional: true },
      { id: 'growth-unit-2',         label: '2nd Business Unit (defined)',       done: false, desc: 'What comes after Helionyx Commons? SaaS? Agency? Domain flipping? Define and document', optional: true },
      { id: 'growth-local-server',   label: 'Business Center Backend (local)',  done: false, desc: 'Set up Node.js server + PostgreSQL locally to power this dashboard with full persistence', optional: true },
    ],
  },
];

// Flat map for quick lookups
export const SETUP_DEFAULTS = Object.fromEntries(
  SETUP_CATEGORIES.flatMap(cat => cat.items.map(item => [item.id, item.done]))
);
