import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export function ProtectedRoute({ children, roles }) {
  const { user, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: '2rem', fontSize: '.8rem', opacity: .7 }}>Checking session...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (roles && !roles.includes(role)) {
    return <Navigate to={`/dashboard/${role}`} replace />;
  }
  return children;
}
