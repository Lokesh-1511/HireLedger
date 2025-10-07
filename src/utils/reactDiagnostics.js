// React diagnostics helper (development only)
// Import this in critical providers if deeper detection is required.
// It will no-op in production.

export function assertSingleReactInstance(ReactRef, label = 'App') {
  if (import.meta.env.PROD) return;
  try {
    if (!ReactRef || !ReactRef.useState) {
      console.error(`[${label}] React reference invalid – hooks may fail.`);
      return;
    }
    const globalKey = '__HL_REACT_SINGLETON__';
    const w = typeof window !== 'undefined' ? window : undefined;
    if (!w) return;
    if (!w[globalKey]) {
      w[globalKey] = ReactRef;
    } else if (w[globalKey] !== ReactRef) {
      console.warn(`[${label}] Detected a second React copy. Fast Refresh / HMR may break hooks.`);
    }
  } catch (e) {
    console.warn(`[${label}] React diagnostics error`, e);
  }
}
