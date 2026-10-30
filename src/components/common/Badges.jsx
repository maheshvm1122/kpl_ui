import { styleMeta } from '../../utils/constants';

export function PaymentBadge({ status }) {
  return status === 'Paid' ? (
    <span className="badge bg-pitch-100 text-pitch-800">● Paid</span>
  ) : (
    <span className="badge bg-amber-100 text-amber-800">● Unpaid</span>
  );
}

export function SoldBadge({ status }) {
  return status === 'Sold' ? (
    <span className="badge bg-red-100 text-red-700">Sold</span>
  ) : (
    <span className="badge bg-slate-100 text-slate-600">Not Sold</span>
  );
}

export function StyleBadge({ style }) {
  const meta = styleMeta(style);
  return (
    <span className={`badge ${meta.color}`}>
      <span aria-hidden>{meta.emoji}</span> {style}
    </span>
  );
}

export function RoleBadge({ role }) {
  return role === 'Admin' ? (
    <span className="badge bg-pitch-100 text-pitch-800">Admin</span>
  ) : (
    <span className="badge bg-gold-300/50 text-amber-900">Auctioneer</span>
  );
}

export function UserStatusBadge({ status }) {
  return status === 'Active' ? (
    <span className="badge bg-pitch-100 text-pitch-800">Active</span>
  ) : (
    <span className="badge bg-slate-200 text-slate-600">Inactive</span>
  );
}
