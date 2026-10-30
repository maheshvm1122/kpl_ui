import { RefreshCw } from 'lucide-react';

export default function PageHeader({ title, subtitle, actions, onRefresh, refreshing }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide text-pitch-900 uppercase">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onRefresh && (
          <button className="btn-secondary" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
