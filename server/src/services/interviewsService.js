import { db } from '../data/seed.js';
import { nanoid } from 'nanoid';

export function listInterviews() { return db.interviews; }
export function createInterview(data) {
  const it = { id:nanoid(), title:data.title, candidate:data.candidate, day:data.day||1, start:data.start||'09:00', end:data.end||'09:30', date:data.date||null };
  db.interviews.push(it); return it;
}
export function updateInterview(id, patch) { const it=db.interviews.find(x=>x.id===id); if(!it) return null; Object.assign(it,patch); return it; }
export function deleteInterview(id) { const i=db.interviews.findIndex(x=>x.id===id); if(i>=0){ db.interviews.splice(i,1); return true;} return false; }
