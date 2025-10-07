import * as React from 'react';
const { createContext, useCallback, useContext, useState, useRef, useEffect } = React;

/*
  Toast System (Client-side only placeholder)
  -----------------------------------------
  TODO(API): Optionally send non-PII toast events for UX analytics.
  TODO(I18N): Localize messages.
*/

const ToastCtx = createContext(null);

let idSeq = 0;

export function ToastProvider({ children }) {
  // Runtime React integrity diagnostics (safe / dev-oriented)
  if (import.meta.env.DEV) {
    if (!React || !React.useState) {
      // eslint-disable-next-line no-console
      console.error('[ToastProvider] React hook dispatcher missing – possible duplicate React bundle.');
    } else if (typeof window !== 'undefined') {
      const existing = window.__HL_REACT_SINGLETON__;
      if (existing && existing !== React) {
        // eslint-disable-next-line no-console
        console.warn('[HireLedger] Multiple React instances detected (ToastContext). This can cause invalid hook calls.');
      }
      window.__HL_REACT_SINGLETON__ = React;
    }
  }
  const [toasts, setToasts] = useState([]);
  const timeouts = useRef(new Map());

  const remove = useCallback(id => {
    setToasts(ts => ts.filter(t => t.id !== id));
    const to = timeouts.current.get(id);
    if (to) { clearTimeout(to); timeouts.current.delete(id); }
  }, []);

  const push = useCallback((msg, opts={}) => {
    const id = ++idSeq;
    const toast = { id, msg, type: opts.type || 'info', ttl: opts.ttl || 4000 };
    setToasts(ts => [...ts, toast]);
    const to = setTimeout(()=> remove(id), toast.ttl);
    timeouts.current.set(id, to);
    return id;
  }, [remove]);

  useEffect(()=> () => { [...timeouts.current.values()].forEach(clearTimeout); }, []);

  return (
    <ToastCtx.Provider value={{ push, remove }}>
      {children}
      <div className="toast-stack" role="region" aria-label="Notifications">
        {toasts.map(t => (
          <div key={t.id} className={"toast toast-"+t.type} role="status" aria-live="polite">
            <span>{t.msg}</span>
            <button aria-label="Dismiss" onClick={()=>remove(t.id)} className="toast-close">✕</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
