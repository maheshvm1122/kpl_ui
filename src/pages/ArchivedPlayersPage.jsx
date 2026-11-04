import { useCallback, useEffect, useState } from 'react';
import { Archive, ArchiveRestore, Eye } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Pagination from '../components/common/Pagination';
import Avatar from '../components/common/Avatar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SearchInput from '../components/common/SearchInput';
import { EmptyState, ErrorState, Loader } from '../components/common/Feedback';
import { PaymentBadge, StyleBadge } from '../components/common/Badges';
import PlayerProfileModal from '../components/players/PlayerProfileModal';
import useQueryState from '../hooks/useQueryState';
import useDebounce from '../hooks/useDebounce';
import { playerService } from '../services';
import { useToast } from '../context/ToastContext';
import { PAGE_SIZE } from '../utils/constants';
import { formatDateTime } from '../utils/format';

const DEFAULTS = { search: '', sortBy: 'slNo', sortOrder: 'asc', page: 1, limit: PAGE_SIZE };

/** Admin: players removed with "Delete" on All Players. They can be restored here. */
export default function ArchivedPlayersPage() {
  const toast = useToast();
  const [query, setQuery] = useQueryState(DEFAULTS);
  const search = useDebounce(query.search);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewId, setViewId] = useState(null);
  const [restorePlayer, setRestorePlayer] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await playerService.list({ ...query, search, archived: 'true' });
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, query.sortBy, query.sortOrder, query.page, query.limit]);

  useEffect(() => {
    load();
  }, [load]);

  const doRestore = async () => {
    setRestoring(true);
    try {
      const res = await playerService.unarchive(restorePlayer._id);
      toast.success(res.message);
      setRestorePlayer(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Archived Players"
        subtitle={result ? `${result.total} archived player(s)` : 'Players deleted from All Players'}
        onRefresh={load}
        refreshing={loading}
      />

      <SearchInput
        className="mb-4 sm:w-72"
        value={query.search}
        onChange={(v) => setQuery({ search: v })}
        placeholder="Search S.L. No, name or mobile"
      />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !result ? (
        <Loader />
      ) : result.items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Archive}
            title="No archived players"
            message="Players you delete from All Players appear here and can be restored."
          />
        </div>
      ) : (
        <>
          <div className={`table-wrap transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>S.L. No</th>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Style</th>
                  <th>Payment</th>
                  <th>Deleted On</th>
                  <th>Deleted By</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="font-semibold whitespace-nowrap text-slate-500">{p.slNo}</td>
                    <td>
                      <Avatar src={p.photoUrl} name={p.fullName} className="opacity-70 grayscale" />
                    </td>
                    <td className="font-medium whitespace-nowrap">{p.fullName}</td>
                    <td className="whitespace-nowrap">{p.mobile}</td>
                    <td>
                      <StyleBadge style={p.cricketStyle} />
                    </td>
                    <td>
                      <PaymentBadge status={p.paymentStatus} />
                    </td>
                    <td className="whitespace-nowrap text-slate-500">{formatDateTime(p.archivedAt)}</td>
                    <td className="whitespace-nowrap">{p.archivedBy?.name || '—'}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost btn-sm" onClick={() => setViewId(p._id)} title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="btn-primary btn-sm whitespace-nowrap" onClick={() => setRestorePlayer(p)}>
                          <ArchiveRestore className="h-4 w-4" /> Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      <PlayerProfileModal playerId={viewId} open={Boolean(viewId)} onClose={() => setViewId(null)} onChanged={load} />
      <ConfirmDialog
        open={Boolean(restorePlayer)}
        title="Restore player?"
        confirmLabel="Restore"
        loading={restoring}
        onCancel={() => setRestorePlayer(null)}
        onConfirm={doRestore}
        message={
          restorePlayer && (
            <>
              <b>{restorePlayer.slNo}</b> – <b>{restorePlayer.fullName}</b> will appear again in All Players
              {restorePlayer.paymentStatus === 'Paid' ? ', Paid Players and the auction pool' : ''}.
            </>
          )
        }
      />
    </>
  );
}
