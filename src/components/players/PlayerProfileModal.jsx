import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gavel, History, Pencil } from 'lucide-react';
import Modal from '../common/Modal';
import { ErrorState, Loader } from '../common/Feedback';
import { PaymentBadge, SoldBadge, StyleBadge } from '../common/Badges';
import EditPlayerModal from './EditPlayerModal';
import usePaymentConfirm from './PaymentConfirm';
import { playerService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatDateTime, imageUrl, rupees } from '../../utils/format';

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{children}</span>
    </div>
  );
}

export default function PlayerProfileModal({ playerId, open, onClose, onChanged }) {
  const { isAdmin } = useAuth();
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    if (!playerId) return;
    setError('');
    try {
      const res = await playerService.get(playerId);
      setPlayer(res.data);
    } catch (err) {
      setError(err.message);
    }
  }, [playerId]);

  useEffect(() => {
    if (open) {
      setPlayer(null);
      load();
    }
  }, [open, load]);

  const handleChanged = (updated) => {
    setPlayer(updated);
    onChanged?.(updated);
  };
  const payment = usePaymentConfirm(handleChanged);

  return (
    <>
      <Modal open={open && !editing} onClose={onClose} title="Player Profile" size="lg">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !player ? (
          <Loader />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col gap-5 sm:flex-row">
              <img
                src={imageUrl(player.photoUrl)}
                alt={player.fullName}
                className="h-48 w-full rounded-xl object-cover sm:h-44 sm:w-44"
              />
              <div className="flex-1">
                <p className="font-display text-3xl font-bold text-pitch-700">{player.slNo}</p>
                <p className="text-xl font-semibold text-slate-900">{player.fullName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StyleBadge style={player.cricketStyle} />
                  <PaymentBadge status={player.paymentStatus} />
                  <SoldBadge status={player.soldStatus} />
                </div>
                {isAdmin && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="btn-secondary btn-sm" onClick={() => setEditing(true)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    {player.paymentStatus === 'Paid' ? (
                      <button className="btn-secondary btn-sm" onClick={() => payment.ask(player, 'Unpaid')}>
                        Mark Unpaid
                      </button>
                    ) : (
                      <button className="btn-primary btn-sm" onClick={() => payment.ask(player, 'Paid')}>
                        Mark Paid
                      </button>
                    )}
                  </div>
                )}
                {player.paymentStatus === 'Paid' && (
                  <Link to={`/auction/${player._id}`} className="btn-gold btn-sm mt-2">
                    <Gavel className="h-3.5 w-3.5" /> Open auction screen
                  </Link>
                )}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h4 className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Registration</h4>
                <Row label="Mobile">{player.mobile}</Row>
                <Row label="Registered">{formatDateTime(player.registrationDate)}</Row>
                <Row label="Payment updated">
                  {player.paymentUpdatedAt
                    ? `${formatDateTime(player.paymentUpdatedAt)} by ${player.paymentUpdatedBy?.name || '—'}`
                    : '—'}
                </Row>
              </div>
              <div>
                <h4 className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">Auction</h4>
                <Row label="Team">{player.team?.name || '—'}</Row>
                <Row label="Sold amount">{rupees(player.soldAmount)}</Row>
                <Row label="Sold on">{formatDate(player.soldAt)}</Row>
              </div>
            </div>

            {player.purchases?.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <History className="h-3.5 w-3.5" /> Sale history
                </h4>
                <ul className="space-y-2">
                  {player.purchases.map((p) => (
                    <li key={p._id} className={`rounded-lg border p-3 text-sm ${p.reversed ? 'border-slate-200 bg-slate-50' : 'border-pitch-200 bg-pitch-50'}`}>
                      <div className="flex flex-wrap justify-between gap-2">
                        <span>
                          Sold to <b>{p.team?.name}</b> for <b>{rupees(p.soldAmount)}</b>
                        </span>
                        {p.reversed && <span className="badge bg-slate-200 text-slate-600">Undone</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDateTime(p.purchaseDate)} by {p.soldBy?.name}
                        {p.reversed && ` · undone ${formatDateTime(p.reversedAt)} by ${p.reversedBy?.name}`}
                      </p>
                      {p.editHistory?.map((e, i) => (
                        <p key={i} className="mt-1 text-xs text-slate-600">
                          ✎ {e.oldTeam?.name} {rupees(e.oldAmount)} → {e.newTeam?.name} {rupees(e.newAmount)} ·{' '}
                          {formatDateTime(e.editedAt)} by {e.editedBy?.name}
                        </p>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
      <EditPlayerModal player={player} open={editing} onClose={() => setEditing(false)} onSaved={handleChanged} />
      {payment.dialog}
    </>
  );
}
