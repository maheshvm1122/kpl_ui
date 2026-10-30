import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';

export function Loader({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-12 text-sm text-slate-500 ${className}`}>
      <Loader2 className="h-5 w-5 animate-spin text-pitch-600" />
      {label}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <Icon className="mb-3 h-10 w-10 text-slate-300" />
      <p className="font-semibold text-slate-700">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <AlertTriangle className="mb-3 h-10 w-10 text-ball-500" />
      <p className="font-semibold text-slate-700">Could not load data</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      {onRetry && (
        <button className="btn-secondary mt-4" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}
