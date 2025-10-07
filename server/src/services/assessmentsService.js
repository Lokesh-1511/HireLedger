import { db } from '../data/seed.js';

export function listRoles() { return Object.keys(db.assessments.roles); }
export function getRoleStats(role) { return db.assessments.roles[role]; }
export function recordAttempt(role, scorePct, elapsedSec) {
  if(!db.assessments.roles[role]) db.assessments.roles[role] = { attempts:[], bestScore:0 };
  const r = db.assessments.roles[role];
  r.attempts.push({ scorePct, elapsedSec, ts:Date.now() });
  if (scorePct > r.bestScore) r.bestScore = scorePct;
  return r;
}
