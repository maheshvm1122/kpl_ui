import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, cls: 'border-pitch-300 bg-pitch-50 text-pitch-800' },
  error: { icon: AlertTriangle, cls: 'border-red-300 bg-red-50 text-red-800' },
  info: { icon: Info, cls: 'border-sky-300 bg-sky-50 text-sky-800' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (type, message, duration = 4000) => {
      const id = ++idRef.current;
      setToasts((list) => [...list.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      success: (m) => show('success', m),
      error: (m) => show('error', m, 6000),
      info: (m) => show('info', m),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 left-4 z-[100] flex flex-col items-end gap-2 sm:left-auto">
        {toasts.map((t) => {
          const { icon: Icon, cls } = STYLES[t.type];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium shadow-lg ${cls}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
