import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { userService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../utils/constants';

const EMPTY = { name: '', mobile: '', email: '', username: '', password: '', role: ROLES.AUCTIONEER };

export default function UserFormModal({ open, user, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = Boolean(user);

  useEffect(() => {
    if (!open) return;
    setForm(user ? { ...EMPTY, ...user, password: '' } : EMPTY);
    setError('');
  }, [open, user]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const onSave = async () => {
    if (form.name.trim().length < 2) return setError('Please enter the full name');
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(form.username)) {
      return setError('Username must be 3-30 characters: letters, numbers, dot, dash or underscore');
    }
    if (form.mobile && !/^[6-9]\d{9}$/.test(form.mobile)) return setError('Please enter a valid 10-digit mobile number');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Please enter a valid email');
    if (!editing && form.password.length < 6) return setError('Password must be at least 6 characters');

    setSaving(true);
    setError('');
    try {
      const values = {
        name: form.name.trim(),
        mobile: form.mobile,
        email: form.email.trim(),
        username: form.username.trim(),
        role: form.role,
      };
      const res = editing
        ? await userService.update(user._id, values)
        : await userService.create({ ...values, password: form.password });
      toast.success(res.message);
      onSaved?.();
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
      title={editing ? `Edit ${user.username}` : 'New user'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create user'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
        <div>
          <label className="label">Full Name *</label>
          <input className="input" value={form.name} onChange={set('name')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Mobile</label>
            <input
              className="input"
              inputMode="numeric"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Username *</label>
            <input className="input" autoCapitalize="none" value={form.username} onChange={set('username')} />
          </div>
          <div>
            <label className="label">Role *</label>
            <select className="input" value={form.role} onChange={set('role')}>
              <option value={ROLES.AUCTIONEER}>Auctioneer</option>
              <option value={ROLES.ADMIN}>Admin</option>
            </select>
          </div>
        </div>
        {!editing && (
          <div>
            <label className="label">Password *</label>
            <input className="input" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
            <p className="mt-1 text-xs text-slate-500">At least 6 characters.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
