// Permanent recruiter/company/jobs seed script.
// Run with: node scripts/seedRecruiterData.js (ensure Firebase config env vars loaded if required)
import { db } from '../src/firebase.js';
import { collection, doc, getDoc, setDoc, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

async function ensureDoc(ref, data) {
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, data);
    return { created: true };
  }
  return { created: false };
}

async function main() {
  console.log('--- Recruiter Data Seed Start ---');
  const now = serverTimestamp();

  // Recruiter user
  const recruiterUid = 'recruiter-demo-001';
  await ensureDoc(doc(db, 'users', recruiterUid), {
    role: 'recruiter',
    email: 'recruiter.demo@example.com',
    displayName: 'Recruiter Demo',
    createdAt: now,
    updatedAt: now,
  });
  await ensureDoc(doc(db, 'users', recruiterUid, 'recruiterProfile', 'recruiterProfile'), {
    companyName: 'DemoTalent Inc',
    companyWebsite: 'https://demotalent.example.com',
    industry: 'Talent',
    location: 'Remote',
    aboutCompany: 'DemoTalent connects students and employers.',
    postedJobsCount: 0,
    verifiedByAdmin: true,
    createdAt: now,
    updatedAt: now,
  });

  // Student user for application linkage
  const studentUid = 'student-demo-001';
  await ensureDoc(doc(db, 'users', studentUid), {
    role: 'student',
    email: 'student.demo@example.com',
    displayName: 'Student Demo',
    createdAt: now,
    updatedAt: now,
  });
  await ensureDoc(doc(db, 'users', studentUid, 'studentProfile', 'studentProfile'), {
    college: 'Demo University',
    department: 'CSE',
    graduationYear: 2026,
    cgpa: 8.2,
    skills: ['JavaScript','React','Firebase'],
    projects: [],
    certificates: [],
    achievements: [],
    profileVisibility: 'public',
    contactPreferences: { email: true, phone: false },
    createdAt: now,
    updatedAt: now,
  });

  // Company doc (optional separate collection) - if you maintain companies collection
  const companyRef = doc(db, 'companies', 'company-demo-001');
  await ensureDoc(companyRef, {
    name: 'DemoTalent Inc',
    website: 'https://demotalent.example.com',
    industry: 'Talent',
    size: '11-50',
    headquarters: 'Remote',
    foundedYear: 2023,
    description: 'A sample company for recruiter demo seeding.',
    social: { linkedin: 'https://linkedin.com/company/demotalent' },
    createdAt: now,
    updatedAt: now,
    verified: true,
  });

  // Check existing jobs
  const existingJobsSnap = await getDocs(query(collection(db, 'jobs'), where('companyId','==', recruiterUid)));
  if (existingJobsSnap.size === 0) {
    const jobBase = { companyId: recruiterUid, companyName: 'DemoTalent Inc', status: 'active', postedAt: now, createdAt: now, updatedAt: now };
    const backend = await addDoc(collection(db, 'jobs'), { ...jobBase, title: 'Backend Engineer Intern', description: 'Work on API endpoints.', location: 'Remote', type: 'Internship', salaryRange: '6-8 LPA', skillsRequired:['Node.js','APIs'] });
    const frontend = await addDoc(collection(db, 'jobs'), { ...jobBase, title: 'Frontend Engineer', description: 'Build responsive UI.', location: 'Remote', type: 'Full-Time', salaryRange: '10-14 LPA', skillsRequired:['React','CSS'] });

    // Application for backend job
    await addDoc(collection(db, 'applications'), {
      jobId: backend.id,
      studentId: studentUid,
      recruiterId: recruiterUid,
      appliedAt: now,
      status: 'applied',
      resumeURL: 'https://example.com/resume.pdf',
      createdAt: now,
      updatedAt: now,
    });
  } else {
    console.log('Jobs already exist for recruiter, skipping job/application creation.');
  }

  console.log('--- Recruiter Data Seed Complete ---');
  process.exit(0);
}

main().catch(e => { console.error('Recruiter seed failed', e); process.exit(1); });
