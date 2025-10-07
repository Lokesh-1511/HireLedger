import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, googleProvider } from '../firebase.js';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { ensureUser, getUser } from '../services/firestoreService.js';
import { assertSingleReactInstance } from '../utils/reactDiagnostics.js';

const STORAGE_KEY = 'auth_session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  assertSingleReactInstance(React, 'AuthProvider');
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const login = useCallback((email, _password, role) => {
    if (!email || !_password || !role) return { ok: false, error: 'All fields required.' };
    const session = { email, role, ts: Date.now() };
    setUser(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    try { await signOut(auth); } catch { /* ignore */ }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const fbUser = res.user;
      // ensure Firestore user document exists / updated
      const firestoreUser = await ensureUser(fbUser);
      const session = {
        email: fbUser.email,
        role: firestoreUser.role || 'student',
        name: firestoreUser.displayName || fbUser.displayName,
        uid: fbUser.uid,
        provider: 'google',
        ts: Date.now(),
        firestore: firestoreUser,
      };
      setUser(session);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, []);

  // Sync firebase auth state (handles refresh / multi-tab)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const firestoreUser = await ensureUser(fbUser);
          // Preserve previously selected role if different from default
          setUser(prev => {
            const role = firestoreUser.role || prev?.role || 'student';
            const session = {
              email: fbUser.email,
              role,
              name: firestoreUser.displayName || fbUser.displayName,
              uid: fbUser.uid,
              provider: 'google',
              ts: Date.now(),
              firestore: firestoreUser,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
            return session;
          });
        } catch (e) {
          console.error('Failed to ensure user', e);
        }
      } else {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = { user, isAuthenticated: !!user, login, logout, loginWithGoogle, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
