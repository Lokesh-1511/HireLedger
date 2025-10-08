// Simple verification script: lists users and active jobs.
import { db } from '../src/firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';

async function main() {
  console.log('--- Verify Users & Jobs ---');
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log('Users:', usersSnap.size);
  usersSnap.docs.forEach(d => console.log(' user:', d.id, d.data().role, d.data().companyId || '-'));
  const activeJobsSnap = await getDocs(query(collection(db, 'jobs'), where('status','==','active')));
  console.log('Active Jobs:', activeJobsSnap.size);
  activeJobsSnap.docs.forEach(d => console.log(' job:', d.id, d.data().title, 'companyId=', d.data().companyId));
  const draftJobsSnap = await getDocs(query(collection(db, 'jobs'), where('status','==','draft')));
  console.log('Draft Jobs:', draftJobsSnap.size);
  draftJobsSnap.docs.forEach(d => console.log(' draft:', d.id, d.data().title));
  console.log('--- Done ---');
}

main().catch(e => { console.error(e); process.exit(1); });
