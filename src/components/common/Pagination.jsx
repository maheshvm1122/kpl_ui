import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS } from '../../utils/constants';

export default function Pagination({ page, totalPages, total, limit, onChange, onLimitChange }) {
  if (!total) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  return (
    <div className="flex flex-col items-center justify-between gap-2 px-1 py-3 text-sm text-slate-500 sm:flex-row">
      <div className="flex items-center gap-3">
        {onLimitChange && (
          <label className="flex items-center gap-1.5">
            Rows
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <span>
          Showing <b className="text-slate-700">{from}</b>–<b className="text-slate-700">{to}</b> of{' '}
          <b className="text-slate-700">{total}</b>
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <span className="px-2">
          Page {page} / {totalPages}
        </span>
        <button className="btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
