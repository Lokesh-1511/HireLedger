// Dev-only Firestore seed helper (browser usage)
// Import and call runInitialSeed() manually from console or a hidden admin panel.
// Ensures idempotent user/profile creation similar to scripts/seedFirestore.js but minimal.
import { db } from './firestoreService.js';
import { doc, setDoc, getDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

async function ensure(docRef, data) {
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    await setDoc(docRef, data);
    return true;
  }
  return false;
}

export async function runInitialSeed() {
  if (import.meta.env.PROD) {
    console.warn('runInitialSeed skipped in production');
    return;
  }
  console.log('Running in-app Firestore seed...');
  const studentId = 'seed-student';
  await ensure(doc(db, 'users', studentId), {
    role: 'student',
    email: 'seed.student@example.com',
    displayName: 'Seed Student',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await ensure(doc(db, 'users', studentId, 'studentProfile', 'studentProfile'), {
    college: 'Seed University',
    graduationYear: 2027,
    skills: ['React', 'Firebase'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addDoc(collection(db, 'jobs'), {
    title: 'Seed Job',
    description: 'Sample job for dev environment',
    companyId: 'seed-recruiter',
    companyName: 'Seed Corp',
    location: 'Remote',
    type: 'Internship',
    status: 'active',
    postedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  console.log('In-app seed complete');
}

// Expose optionally on window for quick manual trigger
if (typeof window !== 'undefined') {
  window.__hireledgerSeed = runInitialSeed;
}
