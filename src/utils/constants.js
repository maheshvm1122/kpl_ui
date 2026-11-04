export const CRICKET_STYLES = [
  { value: 'Batting', label: 'Batting', emoji: '🏏', color: 'bg-amber-100 text-amber-800' },
  { value: 'Bowling', label: 'Bowling', emoji: '🔴', color: 'bg-red-100 text-red-800' },
  { value: 'All-Rounder', label: 'All-Rounder', emoji: '⭐', color: 'bg-sky-100 text-sky-800' },
  { value: 'Wicket-keeper', label: 'Wicket-keeper', emoji: '🧤', color: 'bg-violet-100 text-violet-800' },
];

export const styleMeta = (value) => CRICKET_STYLES.find((s) => s.value === value) || CRICKET_STYLES[0];

/** Tournament branding. Put the logo image at cricketwebapp/public/logo.png */
export const TOURNAMENT = {
  name: 'Kachapur Premier League',
  season: 'Season-2',
  logo: '/logo.png',
  loginImage: '/login-hero.jpg', // big image on the left of the login page
};
export const TOURNAMENT_FULL_NAME = `${TOURNAMENT.name} ${TOURNAMENT.season}`;

/** Bid countdown on the auction screen, in seconds. Set VITE_AUCTION_TIMER_SECONDS in cricketwebapp/.env */
export const AUCTION_TIMER_SECONDS = Math.max(1, parseInt(import.meta.env.VITE_AUCTION_TIMER_SECONDS, 10) || 20);

export const ROLES = { ADMIN: 'Admin', AUCTIONEER: 'Auctioneer' };

export const PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [20, 50, 100, 200, 300]; // max 300, same as the API

export const CHART_COLORS = {
  paid: '#146e40',
  unpaid: '#e2a811',
  sold: '#c62828',
  unsold: '#94a3b8',
  spent: '#c62828',
  remaining: '#43a66d',
  bar: '#146e40',
  line: '#0f5132',
};
