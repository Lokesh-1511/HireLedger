import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from './AuthContext.jsx';
import { withdrawApplication as withdrawApplicationSvc, updateApplicationStatus, addStudentSkill, updateStudentSkill, removeStudentSkill } from '../services/firestoreService.js';

export const APPLICATION_STAGES = ['applied', 'screen', 'interview', 'offer'];

// Skills now persisted in Firestore under users/<uid>/skills
const initialSkills = [];

const StudentDataContext = createContext(null);

function computeProfileCompletion(snapshot) {
  if (!snapshot) return 0;
  const sections = [
    () => snapshot.personal && snapshot.personal.firstName && snapshot.personal.lastName && snapshot.personal.email,
    () => Array.isArray(snapshot.education) && snapshot.education.length > 0 && snapshot.education[0].school && snapshot.education[0].degree,
    () => snapshot.skills && Array.isArray(snapshot.skills.core) && snapshot.skills.core.length > 0,
    () => Array.isArray(snapshot.projects) && snapshot.projects.length > 0 && snapshot.projects[0].name && snapshot.projects[0].description,
    () => snapshot.resume && snapshot.resume.file,
    () => Array.isArray(snapshot.certificates) && snapshot.certificates.length > 0
  ];
  const completed = sections.reduce((acc, fn) => acc + (fn() ? 1 : 0), 0);
  return Math.round((completed / sections.length) * 100);
}

function readProfileSnapshot() {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem('hl_profile_builder_v1');
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return computeProfileCompletion(parsed);
  } catch {
    return 0;
  }
}

function nextStageIndex(currentIndex) {
  return Math.min(currentIndex + 1, APPLICATION_STAGES.length - 1);
}

function clampLevel(level) {
  return Math.max(0, Math.min(5, Math.round(level)));
}

function pushNotification(notifications, payload) {
  const next = [{ id: `notif-${Date.now()}`, read: false, createdAt: Date.now(), ...payload }, ...notifications];
  return next.slice(0, 20);
}

export function StudentDataProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [jobs, setJobs] = useState([]); // Firestore jobs
  const [applicationsRaw, setApplicationsRaw] = useState([]); // raw application docs
  const [interviewsRaw, setInterviewsRaw] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [skills, setSkills] = useState(initialSkills);
  const [filters, setFiltersState] = useState({ query: '', tags: [], tab: 'all' });
  // Merge-style setter so callers can pass partials
  const setFilters = useCallback((patch) => {
    setFiltersState(prev => ({ ...prev, ...patch }));
  }, []);
  const [profileCompletion, setProfileCompletion] = useState(() => readProfileSnapshot());
  const resetStudentData = useCallback(() => {
    setFilters({ query: '', tags: [], tab: 'all' });
  }, []);
  const refreshProfileCompletion = useCallback(() => {
    setProfileCompletion(readProfileSnapshot());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    function onStorage(event) {
      if (event.key === 'hl_profile_builder_v1') {
        refreshProfileCompletion();
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshProfileCompletion]);

  const jobMap = useMemo(() => new Map(jobs.map(j => [j.id, j])), [jobs]);

  const applications = useMemo(() => {
    return applicationsRaw.map(a => ({ ...a, job: jobMap.get(a.jobId) })).filter(a => a.job);
  }, [applicationsRaw, jobMap]);

  const interviews = useMemo(() => interviewsRaw.map(iv => ({ ...iv, job: jobMap.get(iv.jobId) })).filter(iv => iv.job), [interviewsRaw, jobMap]);

  const applyToJob = useCallback(async (jobId) => {
    if (!uid) return;
    // avoid duplicate
    if (applicationsRaw.some(a => a.jobId === jobId)) return;
    await addDoc(collection(db, 'applications'), {
      jobId,
      studentId: uid,
      recruiterId: jobMap.get(jobId)?.companyId || jobMap.get(jobId)?.companyId || 'unknown',
      status: 'applied',
      appliedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await addDoc(collection(db, 'users', uid, 'notifications'), {
      title: 'Application Started',
      message: `Application started for ${jobMap.get(jobId)?.title || 'a role'}.`,
      type: 'job',
      createdAt: serverTimestamp(),
      read: false
    });
  }, [uid, applicationsRaw, jobMap]);

  const setJobStatus = useCallback(async (jobId, status) => {
    await updateDoc(doc(db, 'jobs', jobId), { status, updatedAt: serverTimestamp() });
  }, []);

  const toggleSavedJob = useCallback((jobId) => {
    // Saved state currently local-only; could persist to subcollection later
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, saved: !j.saved } : j));
  }, []);

  const setApplicationStage = useCallback(async (applicationId, status) => {
    await updateApplicationStatus(applicationId, status);
  }, []);

  const advanceApplicationStage = useCallback(async (applicationId) => {
    const app = applicationsRaw.find(a => a.id === applicationId);
    if (!app) return;
    const order = APPLICATION_STAGES;
    const idx = order.indexOf(app.status);
    const next = idx === -1 ? order[0] : order[Math.min(idx + 1, order.length - 1)];
    if (next !== app.status) await updateApplicationStatus(applicationId, next);
  }, [applicationsRaw]);

  const withdrawApplication = useCallback(async (applicationId) => {
    await withdrawApplicationSvc(applicationId);
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid, 'notifications', id), { read: true });
  }, [uid]);

  const clearNotifications = useCallback(async () => {
    if (!uid) return;
    // Bulk delete client-side (fetch snapshot then delete each)
    const qn = await getDocs(collection(db, 'users', uid, 'notifications'));
    await Promise.all(qn.docs.map(d => deleteDoc(d.ref)));
  }, [uid]);

  const updateSkillLevel = useCallback(async (skillId, level) => {
    if (!uid) return;
    await updateStudentSkill(uid, skillId, { level: clampLevel(level) });
  }, [uid]);

  const addSkill = useCallback(async (name, level = 0, goal = 5, category = 'general') => {
    if (!uid) return null;
    return addStudentSkill(uid, { name, level, goal, category });
  }, [uid]);

  const removeSkill = useCallback(async (skillId) => {
    if (!uid) return;
    await removeStudentSkill(uid, skillId);
  }, [uid]);

  // Firestore subscriptions
  // Jobs are public; subscribe regardless of auth to avoid empty feed pre-login.
  useEffect(() => {
    const unsubJobs = onSnapshot(collection(db, 'jobs'), snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Normalize company field & filter out drafts
      const normalized = all
        .filter(j => j.status !== 'draft')
        .map(j => ({
          ...j,
          company: j.company || j.companyName || 'Company',
        }))
        .sort((a,b)=>{
          const at = (a.postedAt && a.postedAt.toMillis?.()) || 0;
          const bt = (b.postedAt && b.postedAt.toMillis?.()) || 0;
          return bt - at;
        });
      setJobs(normalized);
    });
    return () => unsubJobs();
  }, []);

  // User-specific subscriptions (applications, interviews, notifications, skills)
  useEffect(() => {
    if (!uid) {
      setApplicationsRaw([]);
      setInterviewsRaw([]);
      setNotifications([]);
      setSkills([]);
      return;
    }
    const qApps = query(collection(db, 'applications'), where('studentId', '==', uid));
    const unsubApps = onSnapshot(qApps, snap => setApplicationsRaw(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qInts = query(collection(db, 'interviews'), where('studentId', '==', uid));
    const unsubInts = onSnapshot(qInts, snap => setInterviewsRaw(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubNotifications = onSnapshot(collection(db, 'users', uid, 'notifications'), snap => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSkills = onSnapshot(collection(db, 'users', uid, 'skills'), snap => setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.deleted)));
    return () => { unsubApps(); unsubInts(); unsubNotifications(); unsubSkills(); };
  }, [uid]);

  const value = useMemo(() => ({
    jobs,
    applications,
    interviews,
    skills,
    notifications,
    filters,
    applyToJob,
    setJobStatus,
    toggleSavedJob,
    setApplicationStage,
    advanceApplicationStage,
    withdrawApplication,
    markNotificationRead,
    clearNotifications,
  updateSkillLevel,
  addSkill,
  removeSkill,
  setFilters,
    refreshProfileCompletion,
    profileCompletion,
    resetStudentData,
    applicationStages: APPLICATION_STAGES
  }), [
    jobs,
    applications,
    interviews,
    skills,
    notifications,
    filters,
    applyToJob,
    setJobStatus,
    toggleSavedJob,
    setApplicationStage,
    advanceApplicationStage,
    withdrawApplication,
    markNotificationRead,
    clearNotifications,
  updateSkillLevel,
  addSkill,
  removeSkill,
  setFilters,
    refreshProfileCompletion,
    profileCompletion,
    resetStudentData
  ]);

  return (
    <StudentDataContext.Provider value={value}>
      {children}
    </StudentDataContext.Provider>
  );
}

export function useStudentData() {
  const ctx = useContext(StudentDataContext);
  if (!ctx) throw new Error('useStudentData must be used inside StudentDataProvider');
  return ctx;
}
