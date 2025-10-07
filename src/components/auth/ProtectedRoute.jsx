import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const storedSession = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('auth_session') || 'null'); } catch { return null; }
  }, []);
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: '2rem', fontSize: '.8rem', opacity: .7 }}>Checking session...</div>;
  }
  const effectiveUser = user || storedSession;
  const authed = isAuthenticated || !!effectiveUser;
  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  // roles filtering uses effectiveUser
  if (roles && effectiveUser && !roles.includes(effectiveUser.role)) {
    return <Navigate to={`/dashboard/${effectiveUser.role}`} replace />;
  }
  return children;
}
