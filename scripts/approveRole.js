// Approve a pending requestedRole for a user.
// Usage: node scripts/approveRole.js <uid>
import { db } from '../src/firebase.js';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

async function main() {
  const uid = process.argv[2];
  if(!uid) { console.error('Usage: node scripts/approveRole.js <uid>'); process.exit(1); }
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if(!snap.exists()) { console.error('User not found'); process.exit(1); }
  const data = snap.data();
  if(!data.requestedRole) { console.log('No requestedRole to approve. Current role:', data.role); return; }
  await updateDoc(ref, { role: data.requestedRole, requestedRole: null, requestedRoleReason: null, updatedAt: serverTimestamp() });
  console.log('Approved role change. New role:', data.requestedRole);
}

main().catch(e=>{ console.error(e); process.exit(1); });
