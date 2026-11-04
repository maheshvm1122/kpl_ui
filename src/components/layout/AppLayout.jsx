import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Archive,
  BarChart3,
  Gavel,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badges';
import { BrandLogo } from '../common/Avatar';
import { ROLES, TOURNAMENT, TOURNAMENT_FULL_NAME } from '../../utils/constants';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true, roles: [ROLES.ADMIN, ROLES.AUCTIONEER] },
  { to: '/app/players', label: 'All Players', icon: Users, roles: [ROLES.ADMIN] },
  {
    to: '/app/paid-players',
    label: { [ROLES.ADMIN]: 'Paid Players', [ROLES.AUCTIONEER]: 'Auction Pool' },
    icon: Gavel,
    roles: [ROLES.ADMIN, ROLES.AUCTIONEER],
  },
  { to: '/app/teams', label: 'Teams', icon: Shield, roles: [ROLES.ADMIN, ROLES.AUCTIONEER] },
  { to: '/app/team-stats', label: 'Team Statistics', icon: BarChart3, roles: [ROLES.ADMIN, ROLES.AUCTIONEER] },
  { to: '/app/users', label: 'Users', icon: UserCog, roles: [ROLES.ADMIN] },
  { to: '/app/archived-players', label: 'Archived Players', icon: Archive, roles: [ROLES.ADMIN] },
  { to: '/app/audit-logs', label: 'Audit Logs', icon: History, roles: [ROLES.ADMIN] },
];

function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="flex h-full flex-col bg-pitch-900 text-pitch-100">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <BrandLogo className="h-12 w-12" />
        <div className="font-display text-lg leading-tight font-bold tracking-wide text-white uppercase">
          {TOURNAMENT.name}
          <span className="block text-sm font-semibold tracking-[0.2em] text-gold-400">{TOURNAMENT.season}</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const label = typeof item.label === 'string' ? item.label : item.label[user.role];
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-pitch-700 text-white shadow' : 'text-pitch-200 hover:bg-pitch-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-pitch-800 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-pitch-300">@{user.username}</p>
          </div>
          <RoleBadge role={user.role} />
        </div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-pitch-700 px-3 py-2 text-sm text-pitch-100 hover:bg-pitch-800"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%]">
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
          <button
            className="absolute top-4 right-4 rounded-full bg-white p-2 text-slate-700 shadow"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <BrandLogo className="h-8 w-8" />
        <span className="truncate font-display text-lg font-bold tracking-wide text-pitch-900 uppercase">
          {TOURNAMENT_FULL_NAME}
        </span>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
