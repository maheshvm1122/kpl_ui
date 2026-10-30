import { useState } from 'react';
import ConfirmDialog from '../common/ConfirmDialog';
import { playerService } from '../../services';
import { useToast } from '../../context/ToastContext';

/**
 * Mark Paid / Mark Unpaid with confirmation. Usage:
 *   const payment = usePaymentConfirm(onDone);
 *   payment.ask(player, 'Paid');  ...  {payment.dialog}
 */
export default function usePaymentConfirm(onDone) {
  const toast = useToast();
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(false);

  const ask = (player, status) => setTarget({ player, status });

  const confirm = async () => {
    setLoading(true);
    try {
      const res = await playerService.setPayment(target.player._id, target.status);
      toast.success(res.message);
      setTarget(null);
      onDone?.(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dialog = (
    <ConfirmDialog
      open={Boolean(target)}
      title={target?.status === 'Paid' ? 'Mark as Paid?' : 'Mark as Unpaid?'}
      tone={target?.status === 'Paid' ? 'primary' : 'danger'}
      confirmLabel={target?.status === 'Paid' ? 'Yes, mark Paid' : 'Yes, mark Unpaid'}
      loading={loading}
      onCancel={() => setTarget(null)}
      onConfirm={confirm}
      message={
        target && (
          <>
            Mark <b>{target.player.slNo}</b> – <b>{target.player.fullName}</b> as <b>{target.status}</b>?
            {target.status === 'Paid' && (
              <p className="mt-2 text-slate-500">Check that the registration fee has been received in your UPI app or bank statement first.</p>
            )}
          </>
        )
      }
    />
  );

  return { ask, dialog };
}
