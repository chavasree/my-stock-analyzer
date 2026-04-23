// ─────────────────────────────────────────────────────────────────────────────
// useSessionState.js
// Custom hook — like useState but backed by sessionStorage.
// State persists across tab switches within the same session.
// Clears when browser is closed (sessionStorage behavior).
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';

export function useSessionState(key, defaultValue) {
  const [state, setStateRaw] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setState = useCallback((valueOrFn) => {
    setStateRaw(prev => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [key]);

  return [state, setState];
}

// Helper to clear all session state for the app
export function clearAllSessionState() {
  const keys = Object.keys(sessionStorage).filter(k => k.startsWith('sri_'));
  keys.forEach(k => sessionStorage.removeItem(k));
}
