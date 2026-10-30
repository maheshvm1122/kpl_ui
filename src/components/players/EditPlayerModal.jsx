import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { playerService } from '../../services';
import { useToast } from '../../context/ToastContext';
import { CRICKET_STYLES } from '../../utils/constants';
import { imageUrl } from '../../utils/format';
import { compressImage, validateImage, validateUploadSize } from '../../utils/image';

export default function EditPlayerModal({ player, open, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ fullName: '', cricketStyle: '', mobile: '' });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (player && open) {
      setForm({ fullName: player.fullName, cricketStyle: player.cricketStyle, mobile: player.mobile });
      setPhoto(null);
      setPreview('');
      setError('');
    }
  }, [player, open]);

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImage(file);
    if (err) return setError(err);
    const compressed = await compressImage(file);
    const sizeErr = validateUploadSize(compressed);
    if (sizeErr) return setError(sizeErr);
    setPhoto(compressed);
    setPreview(URL.createObjectURL(compressed));
    setError('');
    return undefined;
  };

  const onSave = async () => {
    if (form.fullName.trim().length < 2) return setError('Please enter the full name');
    if (!/^[6-9]\d{9}$/.test(form.mobile)) return setError('Please enter a valid 10-digit mobile number');
    setSaving(true);
    setError('');
    try {
      const res = await playerService.update(player._id, { ...form, fullName: form.fullName.trim(), photo });
      toast.success(res.message);
      onSaved?.(res.data);
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
      title={`Edit ${player?.slNo || 'player'}`}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      {player && (
        <div className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}
          <div className="flex items-center gap-4">
            <img src={preview || imageUrl(player.photoUrl)} alt="" className="h-20 w-20 rounded-xl object-cover" />
            <label className="btn-secondary">
              Change photo
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} />
            </label>
          </div>
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label">Cricket Style</label>
            <select className="input" value={form.cricketStyle} onChange={(e) => setForm({ ...form, cricketStyle: e.target.value })}>
              {CRICKET_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Mobile Number</label>
            <input
              className="input"
              inputMode="numeric"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            />
          </div>
          <p className="text-xs text-slate-500">Payment and sale details are not changed here.</p>
        </div>
      )}
    </Modal>
  );
}
