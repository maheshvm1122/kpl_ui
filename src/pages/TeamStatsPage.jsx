import { useCallback, useEffect, useState } from 'react';
import { FileSpreadsheet, Loader2, Shield } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Avatar from '../components/common/Avatar';
import SearchInput from '../components/common/SearchInput';
import { EmptyState, ErrorState, Loader } from '../components/common/Feedback';
import PlayerProfileModal from '../components/players/PlayerProfileModal';
import { excelService, teamService } from '../services';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';
import { styleMeta } from '../utils/constants';
import { rupees } from '../utils/format';

const SORTS = [
  { value: 'name', label: 'Team name' },
  { value: 'remainingPurse', label: 'Remaining purse' },
  { value: 'playersCount', label: 'Players purchased' },
  { value: 'spentAmount', label: 'Amount spent' },
];

export default function TeamStatsPage() {
  const [teams, setTeams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewId, setViewId] = useState(null);
  const debounced = useDebounce(search);
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teamService.stats({ search: debounced, sortBy });
      setTeams(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debounced, sortBy]);

  useEffect(() => {
    load();
  }, [load]);

  const exportExcel = async () => {
    setExporting(true);
    try {
      await excelService.teamStats(teams);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Team Statistics"
        subtitle="Purses and purchased players"
        onRefresh={load}
        refreshing={loading}
        actions={
          <button className="btn-secondary" onClick={exportExcel} disabled={exporting || !teams?.length}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Download Excel
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput className="sm:w-72" value={search} onChange={setSearch} placeholder="Search team name" />
        <select className="input sm:w-56" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !teams ? (
        <Loader />
      ) : teams.length === 0 ? (
        <div className="card">
          <EmptyState icon={Shield} title="No teams found" />
        </div>
      ) : (
        <div className={`grid gap-4 md:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
          {teams.map((t) => (
            <div key={t._id} className="card flex flex-col overflow-hidden">
              {/* Header */}
              <div className="bg-pitch-900 p-4 text-white">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={t.logoUrl}
                    name={t.name}
                    size="md"
                    rounded="rounded-full"
                    className="ring-2 ring-white/20"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-display text-2xl font-bold tracking-wide uppercase">{t.name}</p>
                    <p className="text-xs text-pitch-200">{t.playersCount} player(s) purchased</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-white/10 px-3 py-1.5">
                    <p className="text-xs text-pitch-200">Total purse</p>
                    <p className="font-semibold">{rupees(t.totalPurse)}</p>
                  </div>
                  <div className="rounded-lg bg-white/10 px-3 py-1.5">
                    <p className="text-xs text-pitch-200">Remaining</p>
                    <p className="font-semibold text-gold-300">{rupees(t.remainingPurse)}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-2">
                {t.players.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No players purchased yet</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {t.players.map((p) => (
                      <li key={p._id}>
                        <button
                          onClick={() => setViewId(p._id)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          <Avatar src={p.photoUrl} name={p.fullName} />
                          <span className="min-w-0 flex-1 leading-snug">
                            <b className="text-pitch-700">{p.slNo}</b> - {p.fullName} -{' '}
                            {styleMeta(p.cricketStyle).emoji} {p.cricketStyle}
                          </span>
                          <span className="font-semibold whitespace-nowrap">{rupees(p.soldAmount)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">Total spent</span>
                <span className="font-display text-2xl font-bold text-ball-500">{rupees(t.spentAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlayerProfileModal playerId={viewId} open={Boolean(viewId)} onClose={() => setViewId(null)} onChanged={load} />
    </>
  );
}
