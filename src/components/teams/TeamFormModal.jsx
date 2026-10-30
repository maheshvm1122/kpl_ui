import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { teamService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { rupees } from '../../utils/format';
import { compressImage, validateImage, validateUploadSize } from '../../utils/image';

const EMPTY = { name: '', ownerName: '', ownerMobile: '', totalPurse: '' };

export default function TeamFormModal({ open, team, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = Boolean(team);
  const spent = team ? team.totalPurse - team.remainingPurse : 0;

  useEffect(() => {
    if (!open) return;
    setForm(
      team
        ? { name: team.name, ownerName: team.ownerName || '', ownerMobile: team.ownerMobile || '', totalPurse: String(team.totalPurse) }
        : EMPTY
    );
    setLogo(null);
    setPreview('');
    setError('');
  }, [open, team]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImage(file);
    if (err) return setError(err);
    const compressed = await compressImage(file, 800);
    const sizeErr = validateUploadSize(compressed);
    if (sizeErr) return setError(sizeErr);
    setLogo(compressed);
    setPreview(URL.createObjectURL(compressed));
    setError('');
    return undefined;
  };

  const onSave = async () => {
    if (form.name.trim().length < 2) return setError('Please enter the team name');
    if (form.ownerMobile && !/^[6-9]\d{9}$/.test(form.ownerMobile)) return setError('Owner mobile must be a valid 10-digit number');
    const purse = Number(form.totalPurse);
    if (!(purse > 0)) return setError('Initial purse must be greater than 0');
    if (editing && purse < spent) return setError(`Initial purse cannot be less than the amount already spent (${rupees(spent)})`);

    setSaving(true);
    setError('');
    try {
      const values = { ...form, name: form.name.trim(), totalPurse: purse, logo };
      const res = editing ? await teamService.update(team._id, values) : await teamService.create(values);
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
      title={editing ? `Edit ${team.name}` : 'New team'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create team'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
        <div className="flex items-center gap-4">
          <Avatar src={preview || team?.logoUrl} name={form.name || 'Team'} size="lg" rounded="rounded-full" />
          <label className="btn-secondary">
            {team?.logoUrl || preview ? 'Change logo' : 'Upload logo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onLogo} />
          </label>
        </div>
        <div>
          <label className="label">Team Name *</label>
          <input className="input" value={form.name} onChange={set('name')} maxLength={80} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Owner Name</label>
            <input className="input" value={form.ownerName} onChange={set('ownerName')} />
          </div>
          <div>
            <label className="label">Owner Mobile</label>
            <input
              className="input"
              inputMode="numeric"
              value={form.ownerMobile}
              onChange={(e) => setForm({ ...form, ownerMobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            />
          </div>
        </div>
        <div>
          <label className="label">Initial Purse Amount (₹) *</label>
          <input
            className="input"
            inputMode="numeric"
            value={form.totalPurse}
            onChange={(e) => setForm({ ...form, totalPurse: e.target.value.replace(/\D/g, '') })}
          />
          {editing && (
            <p className="mt-1 text-xs text-slate-500">
              Already spent {rupees(spent)}. Remaining purse becomes {rupees(Math.max(0, Number(form.totalPurse || 0) - spent))}.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
