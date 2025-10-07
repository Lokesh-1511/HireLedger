import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, where, updateDoc, doc, getDocs, getDoc, limit } from 'firebase/firestore';
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
  const [loading, setLoading] = useState(true);
  const [contextInfo, setContextInfo] = useState({ companyId: null, companyName: null, mode: 'unknown' }); // mode: derived-company | recruiter-fallback | all-fallback

  // Derive company mapping from user doc (users/<uid>) if available
  useEffect(() => {
    let cancelled = false;
    async function loadMeta() {
      if (!uid) { setContextInfo({ companyId: null, companyName: null, mode: 'anonymous' }); return; }
      try {
        const userRef = doc(db, 'users', uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) { setContextInfo(ci => ({ ...ci, mode: 'no-user-doc' })); return; }
        const data = snap.data();
        // Expect recruiter-specific fields (e.g., companyId, companyName). If absent we'll fallback.
        if (data.companyId) {
          setContextInfo({ companyId: data.companyId, companyName: data.companyName || data.displayName || 'Company', mode: 'derived-company' });
        } else {
          setContextInfo({ companyId: null, companyName: data.displayName || 'Recruiter', mode: 'no-company-field' });
        }
      } catch(e) {
        console.warn('Recruiter context company meta load failed', e);
        if (!cancelled) setContextInfo(ci => ({ ...ci, mode: 'meta-error' }));
      }
    }
    loadMeta();
    return () => { cancelled = true; };
  }, [uid]);

  // Subscriptions
  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    let unsubJobs = () => {};
    let unsubApps = () => {};
    let unsubInts = () => {};
    let unsubVer = () => {};
    let unsubMsg = () => {};
    setLoading(true);
    let currentMode = 'init';
    function attachApps() {
      unsubApps = onSnapshot(query(collection(db, 'applications'), where('recruiterId', '==', uid)), snap => setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      unsubInts = onSnapshot(query(collection(db, 'interviews'), where('recruiterId', '==', uid)), snap => setInterviews(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      unsubVer = onSnapshot(query(collection(db, 'verifications'), where('verifiedBy', '==', uid)), snap => setVerifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      unsubMsg = onSnapshot(query(collection(db, 'messages'), where('receiverId', '==', uid)), snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
    function log(mode, count) { console.info('[RecruiterDataContext] mode=', mode, 'jobs=', count); }
    // Primary attempt
    const tryPrimary = () => {
      if (contextInfo.companyId) {
        currentMode = 'companyId';
        unsubJobs = onSnapshot(query(collection(db, 'jobs'), where('companyId', '==', contextInfo.companyId)), snap => {
          const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setJobs(arr); log(currentMode, arr.length);
          if (arr.length === 0) {
            // fallback to uid-based
            unsubJobs(); trySecondary();
          } else { setLoading(false); }
        });
      } else {
        trySecondary();
      }
    };
    const trySecondary = () => {
      currentMode = 'companyId==uid';
      unsubJobs = onSnapshot(query(collection(db, 'jobs'), where('companyId', '==', uid)), snap => {
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setJobs(arr); log(currentMode, arr.length);
        if (arr.length === 0) {
            unsubJobs(); tryTertiary();
        } else { setLoading(false); }
      });
    };
    const tryTertiary = () => {
      currentMode = 'allLimited';
      unsubJobs = onSnapshot(query(collection(db, 'jobs'), limit(25)), snap => {
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setJobs(arr); log(currentMode, arr.length);
        setLoading(false);
      });
    };
    attachApps();
    tryPrimary();
    return () => { unsubJobs(); unsubApps(); unsubInts(); unsubVer(); unsubMsg(); };
  }, [uid, contextInfo.companyId]);

  // Actions
  const addJob = useCallback(async (jobDraft) => {
    if (!uid) return;
    await addDoc(collection(db, 'jobs'), {
      ...jobDraft,
      companyId: contextInfo.companyId || uid,
      companyName: contextInfo.companyName || user?.firestore?.displayName || 'Company',
      status: JOB_STATUS.DRAFT,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }, [uid, user, contextInfo]);

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
    loading,
    contextInfo,
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
