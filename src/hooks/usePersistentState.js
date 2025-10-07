import { useEffect, useState, useRef } from 'react';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function safeRead(key, fallback) {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  if (!isBrowser) return;
  try {
    if (value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    /* ignore quota/permission errors */
  }
}

export function usePersistentState(key, defaultValue, { throttleMs = 0 } = {}) {
  const [state, setState] = useState(() => safeRead(key, defaultValue));
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!throttleMs) {
      safeWrite(key, state);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      safeWrite(key, state);
    }, throttleMs);
  }, [key, state, throttleMs]);

  const reset = () => setState(defaultValue);

  return [state, setState, reset];
}

export default usePersistentState;