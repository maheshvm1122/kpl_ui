import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Lock, LogIn, User, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/common/Avatar';
import { TOURNAMENT } from '../utils/constants';

export default function LoginPage() {
  const { user, login, sessionMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter username and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username.trim(), password);
      const from = location.state?.from?.pathname;
      navigate(from && from !== '/' && from !== '/login' ? from : '/app', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-pitch-900 lg:flex-row">
      {/* Left 60%: tournament logo / poster */}
      <div className="relative h-[42vh] shrink-0 overflow-hidden bg-pitch-900 sm:h-[50vh] lg:h-auto lg:w-3/5">
        {heroFailed ? (
          <div className="flex h-full items-center justify-center">
            <BrandLogo className="h-40 w-40 lg:h-72 lg:w-72" />
          </div>
        ) : (
          <img
            src={TOURNAMENT.loginImage}
            alt={`${TOURNAMENT.name} ${TOURNAMENT.season}`}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setHeroFailed(true)}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-pitch-900 via-transparent to-transparent lg:bg-gradient-to-r lg:via-transparent lg:from-transparent lg:to-pitch-900/60" />
      </div>

      {/* Right 40%: login */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 lg:w-2/5 lg:py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center text-white">
            <h1 className="font-display text-3xl leading-tight font-bold tracking-wide uppercase">{TOURNAMENT.name}</h1>
            <p className="font-display text-lg font-semibold tracking-[0.2em] text-gold-400 uppercase">
              {TOURNAMENT.season}
            </p>
            <p className="mt-1 text-sm text-pitch-200">Admin & Auctioneer login</p>
          </div>

          <form onSubmit={onSubmit} className="card space-y-4 p-6">
            {(error || sessionMessage) && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error || sessionMessage}
              </div>
            )}
            <div>
              <label className="label" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  className="input pl-9"
                  autoComplete="username"
                  autoCapitalize="none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  className="input pl-9"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="mb-2 text-sm text-pitch-200">Are you a player?</p>
            <Link
              to="/registerplayer"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gold-400 text-lg font-bold text-pitch-900 shadow-lg transition hover:bg-gold-300 active:scale-[0.98]"
            >
              <UserPlus className="h-6 w-6" /> Register a Player
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
