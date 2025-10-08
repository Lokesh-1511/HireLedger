// Seed multiple institutions with varied statuses for admin UI.
// Usage: node scripts/seedInstitutions.js
import { db } from '../src/firebase.js';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

const DATA = [
  { name: 'IIT Madras', domain: 'iitm.ac.in', location: 'Chennai', status: 'Verified' },
  { name: 'IIT Delhi', domain: 'iitd.ac.in', location: 'New Delhi', status: 'Pending' },
  { name: 'IIT Bombay', domain: 'iitb.ac.in', location: 'Mumbai', status: 'Rejected' },
  { name: 'NIT Trichy', domain: 'nitt.edu', location: 'Tiruchirappalli', status: 'Verified' },
  { name: 'Anna University', domain: 'annauniv.edu', location: 'Chennai', status: 'Pending' }
];

async function existsByDomain(domain) {
  const q = query(collection(db, 'institutions'), where('domain','==', domain));
  const snap = await getDocs(q);
  return !snap.empty;
}

async function main() {
  let created = 0;
  for (const inst of DATA) {
    if (await existsByDomain(inst.domain)) continue;
    await addDoc(collection(db, 'institutions'), {
      ...inst,
      contacts: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    created++;
  }
  console.log(`Institutions seed complete. Created ${created} new institution(s).`);
  process.exit(0);
}

main().catch(e => { console.error('Institutions seed failed', e); process.exit(1); });
