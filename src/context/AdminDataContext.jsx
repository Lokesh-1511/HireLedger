import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from './AuthContext.jsx';
import { approveRole, rejectRoleRequest, setUserRole, updateInstitutionStatus, createInstitutionWithAudit, logAuditEvent } from '../services/firestoreService.js';

// AdminDataContext
// Provides real-time admin domain data: users, institutions, audit logs.
// Offers action helpers that wrap firestore service functions and emit audit events.

const AdminDataContext = createContext(null);

export function AdminDataProvider({ children }) {
  const { user } = useAuth();
  const actorId = user?.uid || 'anonymous';
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    setLoading(true);
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubInst = onSnapshot(collection(db, 'institutions'), snap => {
      setInstitutions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubJobs = onSnapshot(collection(db, 'jobs'), snap => {
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubApps = onSnapshot(collection(db, 'applications'), snap => {
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAudit = onSnapshot(query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc')), snap => {
      setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => { unsubUsers(); unsubInst(); unsubJobs(); unsubApps(); unsubAudit(); };
  }, []);

  // Actions
  const actionApproveRole = useCallback(async (uid) => {
    const res = await approveRole(uid);
    await logAuditEvent({ actorId, action: 'approve-user', resource: 'user', resourceId: uid, meta: res.role });
    return res;
  }, [actorId]);

  const actionRejectRole = useCallback(async (uid, reason) => {
    return rejectRoleRequest(uid, actorId, reason);
  }, [actorId]);

  const actionAssignRole = useCallback(async (uid, role) => {
    return setUserRole(uid, role, actorId);
  }, [actorId]);

  const actionUpdateInstitutionStatus = useCallback(async (instId, status) => {
    return updateInstitutionStatus(instId, status, actorId);
  }, [actorId]);

  const actionCreateInstitution = useCallback(async (data) => {
    return createInstitutionWithAudit(data, actorId);
  }, [actorId]);

  const value = useMemo(() => ({
    users,
    institutions,
    auditLogs,
    jobs,
    applications,
    loading,
    approveRole: actionApproveRole,
    rejectRole: actionRejectRole,
    assignRole: actionAssignRole,
    updateInstitutionStatus: actionUpdateInstitutionStatus,
    createInstitution: actionCreateInstitution
  }), [users, institutions, auditLogs, jobs, applications, loading, actionApproveRole, actionRejectRole, actionAssignRole, actionUpdateInstitutionStatus, actionCreateInstitution]);

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData must be used within AdminDataProvider');
  return ctx;
}
