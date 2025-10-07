// Create Firebase Auth users with deterministic UIDs & passwords using firebase-admin.
// Usage: node scripts/createAuthUsers.js path/to/serviceAccountKey.json
// NOTE: This does NOT create Firestore profile docs (run other seed scripts first or after).
// Passwords here are for local/dev only. NEVER commit real secrets.

import fs from 'fs';
import process from 'process';

let admin;
try {
  // Dynamic import so dependency is optional until installed.
  admin = await import('firebase-admin');
} catch (e) {
  console.error('firebase-admin not installed. Run: npm install firebase-admin');
  process.exit(1);
}

const serviceKeyPath = process.argv[2];
if (!serviceKeyPath) {
  console.error('Missing service account key path. Usage: node scripts/createAuthUsers.js serviceAccount.json');
  process.exit(1);
}
if (!fs.existsSync(serviceKeyPath)) {
  console.error('Service account file not found:', serviceKeyPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();

const USERS = [
  { uid: 'stu-alice', email: 'alice@student.edu', password: 'Password123!', displayName: 'Alice Chen' },
  { uid: 'stu-bob', email: 'bob@student.edu', password: 'Password123!', displayName: 'Bob Singh' },
  { uid: 'stu-cara', email: 'cara@student.edu', password: 'Password123!', displayName: 'Cara Patel' },
  { uid: 'stu-dan', email: 'dan@student.edu', password: 'Password123!', displayName: 'Dan Kumar' },
  { uid: 'rec-techcorp', email: 'hr@techcorp.com', password: 'Password123!', displayName: 'TechCorp HR' },
  { uid: 'rec-datadash', email: 'talent@datadash.io', password: 'Password123!', displayName: 'DataDash Talent' },
  { uid: 'admin-super', email: 'admin@hireledger.dev', password: 'Password123!', displayName: 'Super Admin' }
];

async function ensureUser(u) {
  try {
    await auth.getUser(u.uid);
    console.log('Exists auth user', u.uid);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      await auth.createUser(u);
      console.log('Created auth user', u.uid);
    } else {
      throw e;
    }
  }
}

async function main() {
  console.log('--- Create Auth Users (Admin) Start ---');
  for (const u of USERS) {
    await ensureUser(u);
  }
  console.log('--- Create Auth Users Complete ---');
  process.exit(0);
}

main().catch(e => { console.error('Create auth users failed', e); process.exit(1); });
