import { useCallback, useEffect, useState } from 'react';
import { FileSpreadsheet, History, Loader2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Pagination from '../components/common/Pagination';
import SearchInput from '../components/common/SearchInput';
import { EmptyState, ErrorState, Loader } from '../components/common/Feedback';
import { RoleBadge } from '../components/common/Badges';
import useQueryState from '../hooks/useQueryState';
import useDebounce from '../hooks/useDebounce';
import { auditService, excelService, userService } from '../services';
import { useToast } from '../context/ToastContext';
import { formatDateTime } from '../utils/format';

const DEFAULTS = { who: '', category: '', search: '', from: '', to: '', page: 1, limit: 50 };

const CATEGORIES = [
  { value: 'auth', label: 'Logins', color: 'bg-slate-100 text-slate-700' },
  { value: 'registration', label: 'Registrations', color: 'bg-sky-100 text-sky-800' },
  { value: 'payment', label: 'Payments', color: 'bg-pitch-100 text-pitch-800' },
  { value: 'player', label: 'Player edits', color: 'bg-amber-100 text-amber-800' },
  { value: 'auction', label: 'Auction', color: 'bg-red-100 text-red-700' },
  { value: 'team', label: 'Teams', color: 'bg-violet-100 text-violet-800' },
  { value: 'user', label: 'Users', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'settings', label: 'Settings', color: 'bg-gold-300/50 text-amber-900' },
];
const categoryMeta = (value) => CATEGORIES.find((c) => c.value === value) || CATEGORIES[0];

function WhoCell({ log }) {
  if (log.actorRole === 'Player') {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">{log.actorName}</span>
        <span className="badge bg-sky-100 text-sky-800">Player</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{log.actorName || '—'}</span>
      {['Admin', 'Auctioneer'].includes(log.actorRole) ? (
        <RoleBadge role={log.actorRole} />
      ) : (
        <span className="badge bg-slate-100 text-slate-600">Unknown</span>
      )}
    </div>
  );
}

/** Admin-only activity history: logins, payments, edits, sales and player registrations. */
export default function AuditLogsPage() {
  const toast = useToast();
  const [query, setQuery] = useQueryState(DEFAULTS);
  const search = useDebounce(query.search);
  const [result, setResult] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await auditService.list({ ...query, search });
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, query.who, query.category, query.from, query.to, query.page, query.limit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    userService
      .list()
      .then((res) => setUsers(res.data))
      .catch(() => {});
  }, []);

  const exportExcel = async () => {
    setExporting(true);
    try {
      await excelService.auditLogs({ ...query, search, page: undefined, limit: undefined });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const admins = users.filter((u) => u.role === 'Admin');
  const auctioneers = users.filter((u) => u.role === 'Auctioneer');

  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle={result ? `${result.total} activity record(s)` : 'Who did what, and when'}
        onRefresh={load}
        refreshing={loading}
        actions={
          <button className="btn-secondary" onClick={exportExcel} disabled={exporting || !result?.total}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Download Excel
          </button>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
        <select className="input lg:w-64" value={query.who} onChange={(e) => setQuery({ who: e.target.value })}>
          <option value="">All activity</option>
          <option value="registrations">Player registrations</option>
          {admins.length > 0 && (
            <optgroup label="Admins">
              {admins.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} (@{u.username})
                </option>
              ))}
            </optgroup>
          )}
          {auctioneers.length > 0 && (
            <optgroup label="Auctioneers">
              {auctioneers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} (@{u.username})
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <select
          className="input lg:w-44"
          value={query.category}
          onChange={(e) => setQuery({ category: e.target.value })}
        >
          <option value="">All types</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <SearchInput
          className="sm:col-span-2 lg:w-64"
          value={query.search}
          onChange={(v) => setQuery({ search: v })}
          placeholder="Search S.L. No, name, team…"
        />
        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            type="date"
            className="input lg:w-40"
            value={query.from}
            max={query.to || undefined}
            onChange={(e) => setQuery({ from: e.target.value })}
            aria-label="From date"
          />
          <span className="text-sm text-slate-500">to</span>
          <input
            type="date"
            className="input lg:w-40"
            value={query.to}
            min={query.from || undefined}
            onChange={(e) => setQuery({ to: e.target.value })}
            aria-label="To date"
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !result ? (
        <Loader />
      ) : result.items.length === 0 ? (
        <div className="card">
          <EmptyState icon={History} title="No activity found" message="Try a different person, type or date range." />
        </div>
      ) : (
        <>
          <div className={`table-wrap transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Who</th>
                  <th>Type</th>
                  <th>Activity</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((log) => {
                  const cat = categoryMeta(log.category);
                  return (
                    <tr key={log._id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap text-slate-500">{formatDateTime(log.createdAt)}</td>
                      <td className="whitespace-nowrap">
                        <WhoCell log={log} />
                      </td>
                      <td>
                        <span className={`badge ${cat.color}`}>{cat.label}</span>
                      </td>
                      <td className="min-w-80 text-slate-700">{log.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            {...result}
            onChange={(page) => setQuery({ page })}
            onLimitChange={(limit) => setQuery({ limit })}
          />
        </>
      )}
    </>
  );
}
