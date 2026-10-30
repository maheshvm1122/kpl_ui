# cricketwebapp – Cricket Auction Web App

React + Vite frontend for player registration and the live auction. Uses React Router, Axios, Tailwind CSS, Recharts and lucide-react icons.

## Setup

Start **CricketBE** first (see `../CricketBE/README.md`), then:

```bash
cd cricketwebapp
npm install
cp .env.example .env      # skip if .env already exists
npm run dev               # http://localhost:5173
```

In development, `/api` and `/uploads` are proxied to the backend (`VITE_PROXY_TARGET`, default `http://localhost:5000`).

### Letting players register from their phones (same Wi-Fi)
```bash
npm run dev:lan
```
Vite prints a Network URL such as `http://192.168.1.20:5173`. Players open `http://192.168.1.20:5173/registerplayer` on their phones. Make a QR code of that link to put on a poster.

### Production build
```bash
npm run build        # output in dist/
```
Production builds use the public API origin in `.env.production`. To deploy, run `npm ci && npm run build` and upload the contents of `dist/` to the web server's document root. Configure the web server to fall back to `index.html` for client-side routes, and allow the frontend origin in the backend's `CLIENT_URL` setting. If the API origin changes, update `.env.production` and rebuild.

## Pages

| URL | Who | What |
|---|---|---|
| `/` | Admin, Auctioneer | Staff login, with a **Register a Player** button for players |
| `/registerplayer` | Players (no login) | 4-field registration → success screen with S.L. No, UPI button, QR and Copy UPI ID. Shows "Registration is disabled. Please contact the admin." when an admin has closed registration |
| `/app` | Admin, Auctioneer | Dashboard with stat cards and charts (Refresh button). Admins also get the **Open / Close registration** switch here |
| `/app/players` | Admin | All players: search, filters, sort, pagination, View / Edit / Mark Paid, bulk Mark Paid |
| `/app/paid-players` | Admin, Auctioneer | Auction pool (All / Not Sold / Sold tabs) |
| `/auction/:id` | Admin (view only), Auctioneer | Full-screen auction view: Sell, Edit sale, Undo sale, Previous / Next, Esc to close |
| `/app/teams` | Admin (edit), Auctioneer (view) | Teams with purse |
| `/app/team-stats` | Admin, Auctioneer | Team cards with purchased players |
| `/app/users` | Admin | Create / edit users, reset password, activate / deactivate |
| `/app/audit-logs` | Admin | Activity history. **Who** dropdown: All activity, Player registrations, or any admin / auctioneer. Filter by type, search and date range; Download Excel |

Tables have a **Rows** selector (20–300 per page) and a **Download Excel** button. The Excel file is built in the browser and includes every row matching the current search / filters, not just the visible page.

Keyboard on the auction screen: **←/→** previous/next player, **Esc** close.

## Structure

```
src/
  services/      axios instance + API calls
  context/       AuthContext, ToastContext
  hooks/         useDebounce, useQueryState (filters kept in the URL)
  components/    common, layout, players, teams, users, dashboard, auction
  pages/         one file per screen
  utils/         formatting, UPI link, image compression, constants
```
