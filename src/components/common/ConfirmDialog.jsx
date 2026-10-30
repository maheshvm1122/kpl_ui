import Modal from './Modal';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  tone = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const btn = tone === 'danger' ? 'btn-danger' : tone === 'gold' ? 'btn-gold' : 'btn-primary';
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? undefined : onCancel}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className={btn} onClick={onConfirm} disabled={loading} autoFocus>
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm text-slate-600">{message}</div>
    </Modal>
  );
}
