import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, where, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';
import { normalizeJob, JOB_STATUS } from '../utils/schemaConstants.js';
import { useAuth } from './AuthContext.jsx';

// Recruiter Firestore-backed context

const RecruiterDataContext = createContext(null);

export function RecruiterDataProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [messages, setMessages] = useState([]);

  // Subscriptions
  useEffect(() => {
    if (!uid) return;
    const qJobs = query(collection(db, 'jobs'), where('companyId', '==', uid));
    const unsubJobs = onSnapshot(qJobs, snap => setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qApps = query(collection(db, 'applications'), where('recruiterId', '==', uid));
    const unsubApps = onSnapshot(qApps, snap => setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qInts = query(collection(db, 'interviews'), where('recruiterId', '==', uid));
    const unsubInts = onSnapshot(qInts, snap => setInterviews(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qVer = query(collection(db, 'verifications'), where('verifiedBy', '==', uid));
    const unsubVer = onSnapshot(qVer, snap => setVerifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qMsg = query(collection(db, 'messages'), where('receiverId', '==', uid));
    const unsubMsg = onSnapshot(qMsg, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubJobs(); unsubApps(); unsubInts(); unsubVer(); unsubMsg(); };
  }, [uid]);

  // Actions
  const addJob = useCallback(async (jobDraft) => {
    if (!uid) return;
    await addDoc(collection(db, 'jobs'), {
      ...jobDraft,
      companyId: uid,
      companyName: user?.firestore?.displayName || 'Company',
      status: JOB_STATUS.DRAFT,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }, [uid, user]);

  const updateApplicantStatus = useCallback(async (applicationId, status) => {
    await updateDoc(doc(db, 'applications', applicationId), { status, updatedAt: serverTimestamp() });
  }, []);

  const bulkMessage = useCallback(async (applicationIds, htmlBody) => {
    if (!uid) return;
    const snaps = await getDocs(query(collection(db, 'applications'), where('__name__', 'in', applicationIds.slice(0, 10))));
    await Promise.all(snaps.docs.map(a => addDoc(collection(db, 'messages'), {
      senderId: uid,
      receiverId: a.data().studentId,
      content: htmlBody,
      sentAt: serverTimestamp(),
      read: false
    })));
  }, [uid]);

  const scheduleInterview = useCallback(async ({ applicationId, jobId, studentId, scheduledAt, mode }) => {
    if (!uid) return;
    await addDoc(collection(db, 'interviews'), {
      applicationId, jobId, studentId, recruiterId: uid, scheduledAt, mode: mode || 'Online', status: 'scheduled', createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
  }, [uid]);

  const updateInterview = useCallback(async (id, patch) => {
    await updateDoc(doc(db, 'interviews', id), { ...patch, updatedAt: serverTimestamp() });
  }, []);

  const requestVerification = useCallback(async (userId, type, remarks) => {
    await addDoc(collection(db, 'verifications'), {
      userId,
      type,
      status: 'pending',
      verifiedBy: null,
      remarks: remarks || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }, []);

  const markVerification = useCallback(async (verificationId, hash) => {
    await updateDoc(doc(db, 'verifications', verificationId), { status: 'verified', hash: hash || null, verifiedAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }, []);

  // Selectors / derived metrics
  const metrics = useMemo(() => {
    const activeJobs = jobs.filter(j => j.status === 'active' || j.status === 'draft').length;
    const applicants = applications.length;
    const offers = applications.filter(a => a.status === 'offer' || a.status === 'hired').length;
    const interviewRate = applicants ? Math.round((interviews.length / applicants) * 100) : 0;
    return { activeJobs, applicants, offers, interviewRate };
  }, [jobs, applications, interviews]);

  const applicationsPerJob = useMemo(() => {
    const map = new Map();
    applications.forEach(a => { map.set(a.jobId, (map.get(a.jobId) || 0) + 1); });
    return jobs.map(j => ({ job: j.title, jobId: j.id, applications: map.get(j.id) || 0 }));
  }, [jobs, applications]);

  const diversityBreakdown = useMemo(() => {
    // Diversity fields not stored; placeholder zero distribution
    return [];
  }, []);

  const verificationsAug = useMemo(() => verifications, [verifications]);

  const value = {
    jobs,
    applicants: applications,
    interviews,
    verifications: verificationsAug,
    messages,
    metrics,
    applicationsPerJob,
    diversityBreakdown,
    addJob,
    updateApplicantStatus,
    bulkMessage,
    scheduleInterview,
    updateInterview,
    requestVerification,
    markVerification
  };

  return <RecruiterDataContext.Provider value={value}>{children}</RecruiterDataContext.Provider>;
}

export function useRecruiterData() {
  const ctx = useContext(RecruiterDataContext);
  if (!ctx) throw new Error('useRecruiterData must be used within RecruiterDataProvider');
  return ctx;
}
