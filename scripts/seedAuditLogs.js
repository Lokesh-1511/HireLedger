// Seed sample audit logs for admin UI testing.
// Usage: node scripts/seedAuditLogs.js
// Idempotent: checks for an existing marker event to avoid duplicates.
import { db } from '../src/firebase.js';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

async function alreadySeeded() {
  const q = query(collection(db, 'auditLogs'), where('meta','==','seed-marker'));
  const snap = await getDocs(q);
  return !snap.empty;
}

async function seed() {
  if (await alreadySeeded()) {
    console.log('Audit logs already seeded. Skipping.');
    return;
  }
  const logs = [
    { actorId: 'admin-super', action: 'login', resource: 'user', resourceId: 'admin-super', meta: 'seed-marker' },
    { actorId: 'admin-super', action: 'assign-role', resource: 'user', resourceId: 'rec-techcorp', meta: 'role=recruiter' },
    { actorId: 'admin-super', action: 'approve-user', resource: 'user', resourceId: 'stu-alice', meta: 'requestedRole=recruiter' },
    { actorId: 'admin-super', action: 'create-institution', resource: 'institution', resourceId: 'inst-seed-001', meta: 'IIT Madras' },
    { actorId: 'admin-super', action: 'approve-institution', resource: 'institution', resourceId: 'inst-seed-001', meta: 'verified' },
    { actorId: 'admin-super', action: 'create-job', resource: 'job', resourceId: 'job-seed-placeholder', meta: 'Backend Engineer' },
  ];
  for (const l of logs) {
    await addDoc(collection(db, 'auditLogs'), { ...l, createdAt: serverTimestamp() });
  }
  console.log('Seeded audit logs:', logs.length);
}

seed().catch(e => { console.error('Audit log seed failed', e); process.exit(1); });
