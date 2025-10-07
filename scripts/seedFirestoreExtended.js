// Extended Firestore seed with richer interconnected mock data.
// Usage (Node ESM): node scripts/seedFirestoreExtended.js
// NOTE: This uses client SDK. For production-grade seeding prefer Admin SDK in a secure environment.
// This script now relies on the central Firestore instance exported from src/firebase.js

import { db } from '../src/firebase.js';
import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';

async function exists(ref) { return (await getDoc(ref)).exists(); }

async function ensure(ref, data) {
  if (await exists(ref)) return false;
  await setDoc(ref, data);
  return true;
}

function ts() { return serverTimestamp(); }

async function seedUsers() {
  const students = [
    { id: 'stu-alice', email: 'alice@student.edu', name: 'Alice Chen', college: 'IIT Madras', dept: 'CSE', year: 2026, cgpa: 8.8, skills: ['React','Node','SQL'], projects: ['Campus App','Resume Parser'] },
    { id: 'stu-bob', email: 'bob@student.edu', name: 'Bob Singh', college: 'IIT Delhi', dept: 'ECE', year: 2025, cgpa: 9.1, skills: ['Go','Kubernetes','Distributed Systems'], projects: ['Telemetry Agent'] },
    { id: 'stu-cara', email: 'cara@student.edu', name: 'Cara Patel', college: 'IIT Bombay', dept: 'ME', year: 2027, cgpa: 8.2, skills: ['Python','ML','Pandas'], projects: ['ML Notebook'] },
    { id: 'stu-dan', email: 'dan@student.edu', name: 'Dan Kumar', college: 'NIT Trichy', dept: 'CSE', year: 2026, cgpa: 7.9, skills: ['Rust','WebAssembly','Security'], projects: ['WASM Sandbox'] }
  ];
  const recruiters = [
    { id: 'rec-techcorp', email: 'hr@techcorp.com', name: 'TechCorp HR', company: 'TechCorp Pvt Ltd', website: 'https://techcorp.com', industry: 'Software' },
    { id: 'rec-datadash', email: 'talent@datadash.io', name: 'DataDash Talent', company: 'DataDash', website: 'https://datadash.io', industry: 'Analytics' }
  ];
  const admins = [
    { id: 'admin-super', email: 'admin@hireledger.dev', name: 'Super Admin', designation: 'Platform Admin' }
  ];

  // Users root
  for (const s of students) {
    await ensure(doc(db, 'users', s.id), {
      role: 'student', email: s.email, displayName: s.name, createdAt: ts(), updatedAt: ts(), notificationsEnabled: true, languagePreference: 'en'
    });
    await ensure(doc(db, 'users', s.id, 'studentProfile', 'studentProfile'), {
      college: s.college, department: s.dept, graduationYear: s.year, cgpa: s.cgpa,
      skills: s.skills, projects: s.projects.map(p => ({ title: p, description: '', techStack: [], link: '' })),
      profileVisibility: 'public', contactPreferences: { email: true, phone: false }, createdAt: ts(), updatedAt: ts()
    });
  }
  for (const r of recruiters) {
    await ensure(doc(db, 'users', r.id), {
      role: 'recruiter', email: r.email, displayName: r.name, createdAt: ts(), updatedAt: ts()
    });
    await ensure(doc(db, 'users', r.id, 'recruiterProfile', 'recruiterProfile'), {
      companyName: r.company, companyWebsite: r.website, industry: r.industry, location: 'Remote', postedJobsCount: 0, verifiedByAdmin: true,
      createdAt: ts(), updatedAt: ts()
    });
  }
  for (const a of admins) {
    await ensure(doc(db, 'users', a.id), {
      role: 'admin', email: a.email, displayName: a.name, createdAt: ts(), updatedAt: ts()
    });
    await ensure(doc(db, 'users', a.id, 'adminProfile', 'adminProfile'), {
      designation: a.designation, permissions: ['manageUsers','verifyInstitutions','auditLogs','assignRoles'], createdAt: ts(), updatedAt: ts()
    });
  }
  return { students, recruiters, admins };
}

async function seedJobs(recruiterId) {
  const list = [
    { title: 'Backend Engineer', companyId: recruiterId, companyName: 'TechCorp Pvt Ltd', description: 'Microservices & APIs', location: 'Remote', type: 'Full-Time', salaryRange: '18-24 LPA', skillsRequired: ['Node.js','PostgreSQL'], status: 'active' },
    { title: 'Data Platform Intern', companyId: recruiterId, companyName: 'TechCorp Pvt Ltd', description: 'ETL pipelines', location: 'Bengaluru', type: 'Internship', salaryRange: '50k-60k stipend', skillsRequired: ['Python','Airflow'], status: 'active' },
    { title: 'Frontend Engineer', companyId: recruiterId, companyName: 'TechCorp Pvt Ltd', description: 'Component library ownership', location: 'Remote', type: 'Full-Time', salaryRange: '16-22 LPA', skillsRequired: ['React','TypeScript'], status: 'draft' }
  ];
  const created = [];
  for (const j of list) {
    // Idempotent: search if a job with same title + companyId already exists
    const q = query(collection(db, 'jobs'), where('title','==', j.title), where('companyId','==', j.companyId));
    const snap = await getDocs(q);
    if (snap.empty) {
      created.push(await addDoc(collection(db, 'jobs'), { ...j, postedAt: ts(), updatedAt: ts() }));
    }
  }
  return created.map(ref => ref.id);
}

async function seedApplications(students, recruiterId) {
  // Fetch active jobs
  const jobSnap = await getDocs(collection(db, 'jobs'));
  const jobs = jobSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(j => j.status === 'active');
  const applications = [];
  for (const s of students) {
    for (const job of jobs.slice(0,2)) { // each student applies to first two active jobs
      const compositeId = `${s.id}__${job.id}`; // deterministic composite (not used as doc id; just uniqueness key)
      // Check if application exists (brute force query by job & student)
      const q = query(collection(db, 'applications'), where('jobId','==', job.id), where('studentId','==', s.id));
      const snap = await getDocs(q);
      if (snap.empty) {
        const ref = await addDoc(collection(db, 'applications'), {
          jobId: job.id,
          studentId: s.id,
            recruiterId: recruiterId,
          appliedAt: ts(),
          status: 'applied',
          createdAt: ts(),
          updatedAt: ts()
        });
        applications.push(ref.id);
      }
    }
  }
  return applications;
}

async function seedInterviews(recruiterId) {
  // Find one application to schedule
  const appSnap = await getDocs(collection(db, 'applications'));
  if (appSnap.empty) return [];
  const first = appSnap.docs[0];
  const data = first.data();
  const q = query(collection(db, 'interviews'), where('applicationId','==', first.id));
  const already = await getDocs(q);
  if (!already.empty) return [];
  const ref = await addDoc(collection(db, 'interviews'), {
    applicationId: first.id,
    jobId: data.jobId,
    studentId: data.studentId,
    recruiterId,
    scheduledAt: ts(),
    mode: 'Online',
    meetingLink: 'https://meet.example.com/mock',
    status: 'scheduled',
    createdAt: ts(), updatedAt: ts()
  });
  return [ref.id];
}

async function seedNotifications(students) {
  for (const s of students.slice(0,2)) {
    await addDoc(collection(db, 'users', s.id, 'notifications'), {
      title: 'Application Received',
      message: 'Your application has been received and is under review.',
      type: 'job',
      createdAt: ts(),
      read: false
    });
  }
}

async function main() {
  console.log('--- Extended Firestore Seed Start ---');
  const { students, recruiters } = await seedUsers();
  const recruiterId = recruiters[0].id;
  await seedJobs(recruiterId);
  await seedApplications(students, recruiterId);
  await seedInterviews(recruiterId);
  await seedNotifications(students);
  console.log('--- Extended Firestore Seed Complete ---');
  process.exit(0);
}

main().catch(err => {
  console.error('Extended seed failed', err);
  process.exit(1);
});
