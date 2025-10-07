// Firestore Service Layer
// Centralizes reads/writes so UI components stay simple and we can evolve schema.
import { db } from '../firebase.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

// Note: dynamic import of typedefs for editor only (no runtime dependency)
// import './firestoreModels';

// db now sourced from centralized firebase.js export (single Firestore instance)

// -------- Utility helpers --------
function timestampFields(isCreate = false) {
  return isCreate
    ? { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
    : { updatedAt: serverTimestamp() };
}

async function safeGet(docRef) {
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// -------- User & Profiles --------
export async function ensureUser(user) {
  if (!user?.uid) throw new Error('ensureUser requires firebase user with uid');
  const ref = doc(db, 'users', user.uid);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, {
      role: 'student', // default; UI can promote later
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0],
      photoURL: user.photoURL || null,
      notificationsEnabled: true,
      languagePreference: 'en',
      isVerified: false,
      ...timestampFields(true),
      lastLogin: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, { lastLogin: serverTimestamp(), ...timestampFields(false) });
  }
  return safeGet(ref);
}

export async function getUser(uid) {
  return safeGet(doc(db, 'users', uid));
}

export async function updateUser(uid, patch) {
  await updateDoc(doc(db, 'users', uid), { ...patch, ...timestampFields(false) });
  return getUser(uid);
}

// Sub-doc helpers (single document subcollections for profiles)
function profileDocRef(uid, type) {
  return doc(db, 'users', uid, type, type); // pattern users/<uid>/<type>/<type>
}

export async function getStudentProfile(uid) {
  return safeGet(profileDocRef(uid, 'studentProfile'));
}
export async function upsertStudentProfile(uid, data) {
  const ref = profileDocRef(uid, 'studentProfile');
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, { ...data, ...timestampFields(false) });
  } else {
    await setDoc(ref, { ...data, ...timestampFields(true) });
  }
  return safeGet(ref);
}

export async function getRecruiterProfile(uid) {
  return safeGet(profileDocRef(uid, 'recruiterProfile'));
}
export async function upsertRecruiterProfile(uid, data) {
  const ref = profileDocRef(uid, 'recruiterProfile');
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, { ...data, ...timestampFields(false) });
  } else {
    await setDoc(ref, { ...data, ...timestampFields(true) });
  }
  return safeGet(ref);
}

export async function getAdminProfile(uid) {
  return safeGet(profileDocRef(uid, 'adminProfile'));
}
export async function upsertAdminProfile(uid, data) {
  const ref = profileDocRef(uid, 'adminProfile');
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, { ...data, ...timestampFields(false) });
  } else {
    await setDoc(ref, { ...data, ...timestampFields(true) });
  }
  return safeGet(ref);
}

// -------- Jobs --------
export async function createJob(job) {
  const ref = await addDoc(collection(db, 'jobs'), { ...job, ...timestampFields(true) });
  return safeGet(ref);
}
export async function listJobs({ status } = {}) {
  let col = collection(db, 'jobs');
  if (status) {
    const q = query(col, where('status', '==', status));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  const snap = await getDocs(col);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// -------- Applications --------
export async function createApplication(appData) {
  const ref = await addDoc(collection(db, 'applications'), { ...appData, ...timestampFields(true) });
  return safeGet(ref);
}

// -------- Interviews --------
export async function createInterview(data) {
  const ref = await addDoc(collection(db, 'interviews'), { ...data, ...timestampFields(true) });
  return safeGet(ref);
}

// -------- Assessments --------
export async function createAssessment(data) {
  const ref = await addDoc(collection(db, 'assessments'), { ...data, ...timestampFields(true) });
  return safeGet(ref);
}

// -------- Verifications --------
export async function createVerification(data) {
  const ref = await addDoc(collection(db, 'verifications'), { ...data, ...timestampFields(true) });
  return safeGet(ref);
}

// -------- Notifications (subcollection) --------
export async function addNotification(uid, notification) {
  const ref = await addDoc(collection(db, 'users', uid, 'notifications'), {
    ...notification,
    createdAt: serverTimestamp(),
    read: false,
  });
  return safeGet(ref);
}

// -------- Messages --------
export async function sendMessage(data) {
  const ref = await addDoc(collection(db, 'messages'), { ...data, ...timestampFields(true) });
  return safeGet(ref);
}

// -------- Institutions --------
export async function createInstitution(data) {
  const ref = await addDoc(collection(db, 'institutions'), { ...data, ...timestampFields(true) });
  return safeGet(ref);
}

// -------- Analytics --------
export async function upsertAnalytics(metricId, data) {
  const ref = doc(db, 'analytics', metricId);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, { ...data, lastUpdated: serverTimestamp() });
  } else {
    await setDoc(ref, { ...data, lastUpdated: serverTimestamp() });
  }
  return safeGet(ref);
}

export { db };
