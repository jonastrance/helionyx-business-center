# Helionyx Business Center - Development Prompt

Use this prompt with Claude Code, Spark, or any AI assistant to develop the Helionyx Business Center.

## Project Context

You are working on the **Helionyx Business Center** — a React + Node.js + Express + PostgreSQL internal business dashboard for Helionyx LLC (web hosting reseller).

**Repo:** https://github.com/jonastrance/helionyx-business-center

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS (client/)
- **Backend:** Express + Node.js ESM (server/)
- **Database:** PostgreSQL via pg (auto-creates tables on boot, falls back to localStorage if no DB)
- **Charts:** Recharts

## Quick Start

```bash
cd business-center

# Install deps
npm install
cd client && npm install && cd ..

# Dev mode (hot reload)
npm run dev
# Server: http://localhost:3000
# Client: http://localhost:5173

# Production
npm run build && npm start
```

## Configuration

Copy `.env.example` to `.env`:
```bash
# PostgreSQL (optional - works without)
DATABASE_URL=postgresql://postgres:password@localhost:5432/helionyx

# WHMCS API
WHMCS_URL=https://helionyxcommons.com/includes/api.php
WHMCS_IDENTIFIER=your_identifier
WHMCS_SECRET=your_secret

# WHM API
WHM_URL=https://host39.registrar-servers.com:2087
WHM_TOKEN=your_token

# AI Providers (optional)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
MINIMAX_API_KEY=
```

## Architecture

- **Panels** live in `client/src/panels/` — each is a React component
- **API routes** in `server/routes/` — Express routers
- **Data constants** in `client/src/data/` — domains, tasks, setup items
- **Global state** via `useApp()` context in `client/src/context/AppContext.jsx`
- **Offline-first:** API calls fallback to localStorage when server is down

## Current Panels (17 total)

| Panel | Description |
|-------|-------------|
| Overview | Dashboard with alerts, stats, domain expiry |
| Tasks | Task management |
| Domains | 73 domains with search/filter |
| WHMCS | Client count, tickets, invoices (needs API creds) |
| Finance | MRR, income/expense ledger, P&L charts |
| Vendors | Vendor management |
| Business Bible | Documentation |
| Business Setup | 35 setup items |
| Server Health | CPU, RAM, disk, accounts (needs WHM token) |
| Uptime | Response time, uptime % |
| SSL | SSL certificate monitoring |
| Abbot AI | Ollama/Anthropic/OpenAI/MiniMax chat |
| Thoughts | Quick capture with tags |
| Projects | Cards + tasks + folder scanner + envelope linking |
| Envelopes | Reusable project metadata — clients, hosting, domains |
| Prompts | Save and reuse prompts, integrates with Abbot |
| Settings | Theme, Ollama URL, API key status |

## Key Files

- `client/src/App.jsx` — Panel router
- `client/src/components/Sidebar.jsx` — Navigation
- `client/src/context/AppContext.jsx` — Global state
- `client/src/api.js` — API client with localStorage fallback
- `server/index.js` — Express server + route registration
- `server/db.js` — PostgreSQL connection + auto-schema

## Business Context

- **Owner:** Ryan Mauldin (jonastrance)
- **Active business:** Helionyx Commons — web hosting reseller at helionyxcommons.com
- **WHMCS admin:** helionyxcommons.com/admin (user: uraod)
- **WHM:** host39.registrar-servers.com:2087 (user: heliipvb)
- **Server IP:** 68.65.122.213
- **73 domains** at Namecheap

## Envelopes System

Envelopes store reusable project metadata that can be linked to multiple projects:

- **Types:** generic, client, hosting, project, domain
- **Fields:** client name/email, company, domain, server IP/URL, WHM/cPanel usernames, registrar info, billing cycle, monthly cost, SSL expiry, notes
- **Usage:** Create an envelope once, then link it to multiple projects in the Projects panel
- **Database:** `envelopes` table with `envelope_id` foreign key in `projects` table

## Safety Guidelines

- **Input sanitization:** Trim strings, limit lengths (max 1000 chars for text fields)
- **Validation:** Validate email formats, numeric ranges, required fields
- **Never expose credentials:** All API keys stay server-side in `.env`
- **Graceful degradation:** Always provide localStorage fallback when server is down
- **Safe error messages:** Return user-friendly errors without leaking system details

## API Routes Pattern

All routes in `server/routes/` should:
1. Sanitize inputs with the `sanitize()` helper
2. Validate required fields before processing
3. Handle missing `pool` (offline mode) gracefully
4. Return meaningful error messages

Example:
```javascript
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.trim().slice(0, 1000);
}
```

---

*Run with: `cd business-center && claude`*
