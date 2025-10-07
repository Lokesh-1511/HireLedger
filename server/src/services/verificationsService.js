import { db } from '../data/seed.js';
import { nanoid } from 'nanoid';

export function listVerifications() { return db.verifications; }
export function requestVerification(name) { const v={ id:nanoid(), name, status:'pending'}; db.verifications.push(v); return v; }
export function markVerification(id, status='verified') { const v=db.verifications.find(x=>x.id===id); if(!v) return null; v.status=status; return v; }
