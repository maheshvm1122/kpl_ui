import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileSpreadsheet, Loader2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Pagination from '../components/common/Pagination';
import Avatar from '../components/common/Avatar';
import { EmptyState, ErrorState, Loader } from '../components/common/Feedback';
import { PaymentBadge, SoldBadge, StyleBadge } from '../components/common/Badges';
import PlayerFilters from '../components/players/PlayerFilters';
import useQueryState from '../hooks/useQueryState';
import useDebounce from '../hooks/useDebounce';
import { excelService, playerService } from '../services';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { PAGE_SIZE } from '../utils/constants';
import { rupees } from '../utils/format';

const DEFAULTS = {
  search: '',
  soldStatus: '',
  cricketStyle: '',
  sortBy: 'slNo',
  sortOrder: 'asc',
  page: 1,
  limit: PAGE_SIZE,
};

const TABS = [
  { value: '', label: 'All' },
  { value: 'NotSold', label: 'Not Sold' },
  { value: 'Sold', label: 'Sold' },
];

/** Paid players = the auction pool. "View" opens the full-screen auction screen. */
export default function PaidPlayersPage() {
  const { isAuctioneer } = useAuth();
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const [query, setQuery, queryString] = useQueryState(DEFAULTS);
  const search = useDebounce(query.search);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await playerService.list({ ...query, search, paymentStatus: 'Paid' });
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, query.soldStatus, query.cricketStyle, query.sortBy, query.sortOrder, query.page, query.limit]);

  useEffect(() => {
    load();
  }, [load]);

  /** Downloads all paid players matching the current tab / search / filters. */
  const exportExcel = async () => {
    setExporting(true);
    try {
      await excelService.players({ ...query, search, paymentStatus: 'Paid' }, 'paid-players');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const openAuction = (id) => navigate(`/auction/${id}`, { state: { listQuery: queryString } });

  return (
    <>
      <PageHeader
        title={isAuctioneer ? 'Auction Pool' : 'Paid Players'}
        subtitle={result ? `${result.total} paid player(s)` : 'Players who have paid'}
        onRefresh={load}
        refreshing={loading}
        actions={
          <button className="btn-secondary" onClick={exportExcel} disabled={exporting || !result?.total}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Download Excel
          </button>
        }
      />

      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setQuery({ soldStatus: t.value })}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
              query.soldStatus === t.value ? 'bg-pitch-700 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <PlayerFilters query={query} setQuery={setQuery} searchPlaceholder="Search S.L. No or name" />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !result ? (
        <Loader />
      ) : result.items.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No paid players"
            message="Players appear here once the admin marks their payment as Paid."
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
                  <th>Style</th>
                  <th>Payment</th>
                  <th>Sold</th>
                  <th>Team / Amount</th>
                  <th className="text-right">Auction</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((p) => (
                  <tr key={p._id} className="cursor-pointer hover:bg-slate-50" onClick={() => openAuction(p._id)}>
                    <td className="font-semibold whitespace-nowrap text-pitch-700">{p.slNo}</td>
                    <td>
                      <Avatar src={p.photoUrl} name={p.fullName} size="md" />
                    </td>
                    <td className="font-medium whitespace-nowrap">{p.fullName}</td>
                    <td>
                      <StyleBadge style={p.cricketStyle} />
                    </td>
                    <td>
                      <PaymentBadge status={p.paymentStatus} />
                    </td>
                    <td>
                      <SoldBadge status={p.soldStatus} />
                    </td>
                    <td className="whitespace-nowrap">
                      {p.soldStatus === 'Sold' ? (
                        <>
                          {p.team?.name} · <b>{rupees(p.soldAmount)}</b>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        className="btn-gold btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAuction(p._id);
                        }}
                      >
                        <Eye className="h-4 w-4" /> View
                      </button>
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
    </>
  );
}
