import { db } from '../data/seed.js';
import { nanoid } from 'nanoid';

export function listJobs() { return db.jobs; }
export function getJob(id) { return db.jobs.find(j=>j.id===id); }
export function createJob(data) {
  const job = { id:nanoid(), title:data.title, company:data.company||'Unknown', location:data.location||'Remote', applicants:0, status:'open', createdAt:Date.now() };
  db.jobs.push(job); return job;
}
export function updateJob(id, patch) {
  const job = getJob(id); if(!job) return null; Object.assign(job, patch); return job;
}
export function deleteJob(id) { const i=db.jobs.findIndex(j=>j.id===id); if(i>=0){ db.jobs.splice(i,1); return true;} return false; }
