import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import SaleForm from './SaleForm';
import { auctionService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { rupees } from '../../utils/format';

export default function EditSaleModal({ open, player, teams, onClose, onSaved }) {
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [teamId, setTeamId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && player) {
      setAmount(String(player.soldAmount || ''));
      setTeamId(player.team?._id || '');
      setError('');
    }
  }, [open, player]);

  const onSave = async () => {
    if (!teamId) return setError('Please choose a team');
    if (!(Number(amount) > 0)) return setError('Amount must be greater than 0');
    setSaving(true);
    setError('');
    try {
      const res = await auctionService.editSale(player._id, teamId, Number(amount));
      toast.success(res.message);
      onSaved?.(res.data.player);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={`Edit sale · ${player?.slNo || ''}`}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save sale'}
          </button>
        </>
      }
    >
      {player && (
        <div className="space-y-4">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Currently sold to <b>{player.team?.name}</b> for <b>{rupees(player.soldAmount)}</b>. The old amount goes
            back to the old team&apos;s purse and the new amount is taken from the new team.
          </p>
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
          <SaleForm
            amount={amount}
            setAmount={setAmount}
            teamId={teamId}
            setTeamId={setTeamId}
            teams={teams}
            extraPurse={{ teamId: player.team?._id, amount: player.soldAmount }}
          />
        </div>
      )}
    </Modal>
  );
}
