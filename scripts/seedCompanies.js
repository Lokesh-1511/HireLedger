// Seed companies collection and backfill recruiter profiles with companyId reference.
// Usage: node scripts/seedCompanies.js
// Relies on client SDK (suitable for lightweight dev seeding). For production/admin tasks prefer firebase-admin.
import { db } from '../src/firebase.js';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';

async function ensureCompanyByName(name, data) {
  const q = query(collection(db, 'companies'), where('name','==', name));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return { id: snap.docs[0].id, ...snap.docs[0].data(), existed: true };
  }
  const ref = await addDoc(collection(db, 'companies'), {
    ...data,
    name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    verified: data.verified ?? false
  });
  return { id: ref.id, ...(await getDoc(ref)).data(), existed: false };
}

async function linkRecruiterProfiles(companiesMap) {
  // companiesMap: { companyName: companyId }
  // recruiter profiles live at users/<uid>/recruiterProfile/recruiterProfile
  const recruitersToLink = [
    { uid: 'rec-techcorp', company: 'TechCorp Pvt Ltd' },
    { uid: 'rec-datadash', company: 'DataDash' }
  ];
  for (const r of recruitersToLink) {
    const companyId = companiesMap[r.company];
    if (!companyId) continue;
    const profileRef = doc(db, 'users', r.uid, 'recruiterProfile', 'recruiterProfile');
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      const current = snap.data();
      if (current.companyId !== companyId) {
        await updateDoc(profileRef, { companyId, updatedAt: serverTimestamp() });
        console.log(`Linked recruiter ${r.uid} -> companyId ${companyId}`);
      }
    }
  }
}

async function main() {
  console.log('--- Company Seed Start ---');
  const companies = [
    {
      name: 'TechCorp Pvt Ltd',
      legalName: 'TechCorp Private Limited',
      website: 'https://techcorp.com',
      industry: 'Software',
      size: '201-500',
      headquarters: 'Bengaluru, India',
      foundedYear: 2014,
      description: 'Platform engineering, data infrastructure, and developer tooling solutions.',
      social: { linkedin: 'https://linkedin.com/company/techcorp' },
      verified: true
    },
    {
      name: 'DataDash',
      legalName: 'DataDash Analytics Inc',
      website: 'https://datadash.io',
      industry: 'Analytics',
      size: '51-200',
      headquarters: 'Remote',
      foundedYear: 2019,
      description: 'Real-time data observability and pipeline optimization.',
      social: { linkedin: 'https://linkedin.com/company/datadash-analytics' },
      verified: true
    }
  ];

  const map = {};
  for (const c of companies) {
    const { id, existed } = await ensureCompanyByName(c.name, c);
    map[c.name] = id;
    console.log(`${existed ? 'Exists' : 'Created'} company`, c.name, '->', id);
  }

  await linkRecruiterProfiles(map);
  console.log('--- Company Seed Complete ---');
  process.exit(0);
}

main().catch(e => { console.error('Company seed failed', e); process.exit(1); });
