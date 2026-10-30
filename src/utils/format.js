import { API_ORIGIN } from '../services/api';

export const rupees = (value) =>
  value === null || value === undefined || value === '' ? '—' : `₹${Number(value).toLocaleString('en-IN')}`;

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const imageUrl = (path) => {
  if (!path) return '';
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `${API_ORIGIN}${path}`;
};

/** Builds the UPI intent link that opens GPay / PhonePe / Paytm with everything pre-filled. */
export const buildUpiLink = ({ upiId, payeeName, amount, note }) => {
  const params = [
    `pa=${encodeURIComponent(upiId)}`,
    `pn=${encodeURIComponent(payeeName || '')}`,
    `am=${encodeURIComponent(Number(amount).toFixed(2))}`,
    'cu=INR',
    `tn=${encodeURIComponent(note || '')}`,
  ];
  return `upi://pay?${params.join('&')}`;
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
