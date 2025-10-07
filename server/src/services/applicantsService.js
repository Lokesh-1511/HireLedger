import { db } from '../data/seed.js';
import { nanoid } from 'nanoid';

export function listApplicants() { return db.applicants; }
export function createApplicant(data) {
  const a = { id:nanoid(), name:data.name, role:data.role||'Unknown', status:data.status||'applied', diversity:data.diversity||'unspecified', jobId:data.jobId||null };
  db.applicants.push(a); return a;
}
export function updateApplicant(id, patch) { const a=db.applicants.find(x=>x.id===id); if(!a) return null; Object.assign(a,patch); return a; }
export function deleteApplicant(id) { const i=db.applicants.findIndex(a=>a.id===id); if(i>=0){ db.applicants.splice(i,1); return true;} return false; }
export function bulkMessage(ids, message) { ids.forEach(id=> db.messages.push({ id:nanoid(), applicantId:id, message, ts:Date.now() })); return true; }
