import { useCallback, useEffect, useState } from 'react';
import { CheckCheck, Eye, FileSpreadsheet, Loader2, Pencil } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Pagination from '../components/common/Pagination';
import Avatar from '../components/common/Avatar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { EmptyState, ErrorState, Loader } from '../components/common/Feedback';
import { PaymentBadge, SoldBadge, StyleBadge } from '../components/common/Badges';
import PlayerFilters from '../components/players/PlayerFilters';
import PlayerProfileModal from '../components/players/PlayerProfileModal';
import EditPlayerModal from '../components/players/EditPlayerModal';
import usePaymentConfirm from '../components/players/PaymentConfirm';
import useQueryState from '../hooks/useQueryState';
import useDebounce from '../hooks/useDebounce';
import { excelService, playerService, teamService } from '../services';
import { useToast } from '../context/ToastContext';
import { PAGE_SIZE } from '../utils/constants';
import { formatDate, rupees } from '../utils/format';

const DEFAULTS = {
  search: '',
  paymentStatus: '',
  soldStatus: '',
  cricketStyle: '',
  team: '',
  sortBy: 'slNo',
  sortOrder: 'asc',
  page: 1,
  limit: PAGE_SIZE,
};

export default function PlayersPage() {
  const toast = useToast();
  const [query, setQuery] = useQueryState(DEFAULTS);
  const search = useDebounce(query.search);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teams, setTeams] = useState([]);
  const [selected, setSelected] = useState([]);
  const [viewId, setViewId] = useState(null);
  const [editPlayer, setEditPlayer] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await playerService.list({ ...query, search });
      setResult(res.data);
      setSelected([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    query.paymentStatus,
    query.soldStatus,
    query.cricketStyle,
    query.team,
    query.sortBy,
    query.sortOrder,
    query.page,
    query.limit,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    teamService
      .list()
      .then((res) => setTeams(res.data))
      .catch(() => {});
  }, []);

  const payment = usePaymentConfirm(() => load());

  const unpaidOnPage = result?.items.filter((p) => p.paymentStatus === 'Unpaid') || [];
  const allSelected = unpaidOnPage.length > 0 && unpaidOnPage.every((p) => selected.includes(p._id));
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = () => setSelected(allSelected ? [] : unpaidOnPage.map((p) => p._id));

  /** Downloads all players matching the current search / filters (not just this page). */
  const exportExcel = async () => {
    setExporting(true);
    try {
      await excelService.players({ ...query, search }, 'players');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const runBulk = async () => {
    setBulkLoading(true);
    try {
      const res = await playerService.bulkPayment(selected, 'Paid');
      toast.success(res.message);
      setBulkOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="All Players"
        subtitle={result ? `${result.total} player(s)` : 'Registered players'}
        onRefresh={load}
        refreshing={loading}
        actions={
          <>
            {selected.length > 0 && (
              <button className="btn-primary" onClick={() => setBulkOpen(true)}>
                <CheckCheck className="h-4 w-4" /> Mark {selected.length} Paid
              </button>
            )}
            <button className="btn-secondary" onClick={exportExcel} disabled={exporting || !result?.total}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Download Excel
            </button>
          </>
        }
      />

      <PlayerFilters query={query} setQuery={setQuery} teams={teams} show={{ payment: true, sold: true, team: true }} />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !result ? (
        <Loader />
      ) : result.items.length === 0 ? (
        <div className="card">
          <EmptyState title="No players found" message="Try a different search or clear the filters." />
        </div>
      ) : (
        <>
          <div className={`table-wrap transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={!unpaidOnPage.length}
                      title="Select unpaid players on this page"
                    />
                  </th>
                  <th>S.L. No</th>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Style</th>
                  <th>Registered</th>
                  <th>Payment</th>
                  <th>Sold</th>
                  <th>Team</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td>
                      {p.paymentStatus === 'Unpaid' && (
                        <input type="checkbox" checked={selected.includes(p._id)} onChange={() => toggle(p._id)} />
                      )}
                    </td>
                    <td className="font-semibold whitespace-nowrap text-pitch-700">{p.slNo}</td>
                    <td>
                      <Avatar src={p.photoUrl} name={p.fullName} />
                    </td>
                    <td className="font-medium whitespace-nowrap">{p.fullName}</td>
                    <td className="whitespace-nowrap">{p.mobile}</td>
                    <td>
                      <StyleBadge style={p.cricketStyle} />
                    </td>
                    <td className="whitespace-nowrap text-slate-500">{formatDate(p.registrationDate)}</td>
                    <td>
                      <PaymentBadge status={p.paymentStatus} />
                    </td>
                    <td>
                      <SoldBadge status={p.soldStatus} />
                    </td>
                    <td className="whitespace-nowrap">{p.team?.name || '—'}</td>
                    <td className="text-right whitespace-nowrap">
                      {p.soldStatus === 'Sold' ? rupees(p.soldAmount) : '—'}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost btn-sm" onClick={() => setViewId(p._id)} title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="btn-ghost btn-sm" onClick={() => setEditPlayer(p)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        {p.paymentStatus === 'Paid' ? (
                          <button
                            className="btn-secondary btn-sm whitespace-nowrap"
                            onClick={() => payment.ask(p, 'Unpaid')}
                            disabled={p.soldStatus === 'Sold'}
                            title={p.soldStatus === 'Sold' ? 'Sold players cannot be marked unpaid' : ''}
                          >
                            Mark Unpaid
                          </button>
                        ) : (
                          <button
                            className="btn-primary btn-sm whitespace-nowrap"
                            onClick={() => payment.ask(p, 'Paid')}
                          >
                            Mark Paid
                          </button>
                        )}
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
      <EditPlayerModal
        player={editPlayer}
        open={Boolean(editPlayer)}
        onClose={() => setEditPlayer(null)}
        onSaved={load}
      />
      {payment.dialog}
      <ConfirmDialog
        open={bulkOpen}
        title="Mark selected players Paid?"
        message={`${selected.length} player(s) will be marked Paid. Make sure each payment is received.`}
        confirmLabel="Mark Paid"
        loading={bulkLoading}
        onCancel={() => setBulkOpen(false)}
        onConfirm={runBulk}
      />
    </>
  );
}
