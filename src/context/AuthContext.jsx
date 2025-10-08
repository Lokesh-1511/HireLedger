import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, googleProvider } from '../firebase.js';
import { signInWithPopup, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ensureUser, db } from '../services/firestoreService.js';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { assertSingleReactInstance } from '../utils/reactDiagnostics.js';

const STORAGE_KEY = 'auth_session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  assertSingleReactInstance(React, 'AuthProvider');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((fbUser, firestoreUser) => {
    if (!fbUser) { setUser(null); return; }
    const session = {
      email: fbUser.email,
      role: firestoreUser.role || 'student',
      requestedRole: firestoreUser.requestedRole || null,
      name: firestoreUser.displayName || fbUser.displayName,
      uid: fbUser.uid,
      provider: fbUser.providerData?.[0]?.providerId || 'firebase',
      ts: Date.now(),
      firestore: firestoreUser,
    };
    setUser(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const logout = useCallback(async () => {
    try { await signOut(auth); } catch {/* ignore */}
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const firestoreUser = await ensureUser(res.user);
      applySession(res.user, firestoreUser);
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [applySession]);

  const registerEmail = useCallback(async (email, password, desiredRole='student') => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      let firestoreUser = await ensureUser(cred.user); // default student doc
      // Prevent self-assignment of admin at registration time
      const safeRole = desiredRole === 'admin' ? 'student' : desiredRole;
      if (safeRole && safeRole !== firestoreUser.role) {
        const ref = doc(db, 'users', cred.user.uid);
        await updateDoc(ref, { role: safeRole, updatedAt: Date.now() });
        const snap = await getDoc(ref);
        firestoreUser = snap.data();
      }
      applySession(cred.user, firestoreUser);
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [applySession]);

  const loginEmail = useCallback(async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const firestoreUser = await ensureUser(cred.user);
      applySession(cred.user, firestoreUser);
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message }; }
  }, [applySession]);

  // Explicit refresh (e.g., after requesting a role change)
  const refreshUser = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return { ok: false, error: 'No auth user' };
    try {
      const ref = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return { ok: false, error: 'User doc missing' };
      applySession(fbUser, snap.data());
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, [applySession]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const firestoreUser = await ensureUser(fbUser);
            applySession(fbUser, firestoreUser);
        } catch (e) { console.error('ensureUser failed', e); }
      } else {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [applySession]);

  const value = {
    user,
    role: user?.role || 'student',
    requestedRole: user?.requestedRole || null,
    loading,
    isAuthenticated: !!user,
    logout,
    loginWithGoogle,
    registerEmail,
    loginEmail,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuth must be used within AuthProvider'); return ctx; }
