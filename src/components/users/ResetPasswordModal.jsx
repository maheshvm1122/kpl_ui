import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { userService } from '../../services';
import { useToast } from '../../context/ToastContext';

export default function ResetPasswordModal({ open, user, onClose }) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword('');
      setConfirm('');
      setError('');
    }
  }, [open]);

  const onSave = async () => {
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setSaving(true);
    try {
      const res = await userService.resetPassword(user._id, password);
      toast.success(res.message);
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
      size="sm"
      onClose={saving ? undefined : onClose}
      title={`Reset password · ${user?.username || ''}`}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Reset password'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
        <div>
          <label className="label">New password</label>
          <input className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input className="input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <p className="text-xs text-slate-500">The user will be logged out of other devices.</p>
      </div>
    </Modal>
  );
}
