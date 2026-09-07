# MSC Event Sim Leaderboard

Public display board for the MSC Oberlausitz Dreiecksrennen simulator leaderboard.

Live at: **[sim.event.msc-oberlausitz.de](https://sim.event.msc-oberlausitz.de)**

## Features

- Shows fastest simulator lap times for Saturday and Sunday
- Top 3 displayed prominently (podium style)
- Remaining entries scroll automatically
- Auto-refreshes every 10 seconds
- Designed for TV/monitor fullscreen display

## Setup

```bash
cp .env.local.example .env.local
# edit VITE_API_BASE_URL if needed
npm install
npm run dev
```

## Deploy

Deployed to Vercel. Push to `main` triggers auto-deploy.

- Subdomain: `sim.event.msc-oberlausitz.de`
- API: MSC Event Backend `/public/sim/leaderboard`

## Entry Management

Entries are managed through the Nennungstool admin panel at `/admin/sim`.
Requires the `simulator_manager` (or `admin`) role.
