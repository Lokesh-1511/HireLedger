// Seed Firestore with mock data.
// Run in a Node environment with proper Firebase config env vars OR adapt to run once in-app (see firestoreSeed.js).
import { db } from '../src/firebase.js';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';


async function ensure(docRef, data) {
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    await setDoc(docRef, data);
    return { created: true };
  }
  return { created: false };
}

async function seed() {
  console.log('--- HireLedger Firestore Seed Start ---');

  // Users
  const studentId = 'mock-student-uid';
  const recruiterId = 'mock-recruiter-uid';
  const adminId = 'mock-admin-uid';

  await ensure(doc(db, 'users', studentId), {
    role: 'student',
    email: 'student@example.com',
    displayName: 'Alice Student',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    notificationsEnabled: true,
    languagePreference: 'en',
  });
  await ensure(doc(db, 'users', recruiterId), {
    role: 'recruiter',
    email: 'recruiter@example.com',
    displayName: 'Bob Recruiter',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await ensure(doc(db, 'users', adminId), {
    role: 'admin',
    email: 'admin@example.com',
    displayName: 'Carol Admin',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Student profile
  await ensure(doc(db, 'users', studentId, 'studentProfile', 'studentProfile'), {
    college: 'IIT Madras',
    department: 'CSE',
    graduationYear: 2026,
    cgpa: 8.8,
    skills: ['React', 'Node.js', 'AI'],
    projects: [
      {
        title: 'Campus App',
        description: 'PWA for event management',
        techStack: ['React', 'Firebase'],
        link: 'https://github.com/example/campus-app'
      }
    ],
    certificates: [
      { title: 'AWS Certified', issuer: 'Amazon', date: '2024-07-10', verified: false }
    ],
    achievements: ['Hackathon Winner 2024'],
    profileVisibility: 'public',
    contactPreferences: { email: true, phone: false },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Recruiter profile
  await ensure(doc(db, 'users', recruiterId, 'recruiterProfile', 'recruiterProfile'), {
    companyName: 'TechCorp Pvt Ltd',
    companyWebsite: 'https://techcorp.com',
    industry: 'Software',
    location: 'Bengaluru, India',
    aboutCompany: 'We build scalable SaaS platforms.',
    postedJobsCount: 0,
    verifiedByAdmin: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Admin profile
  await ensure(doc(db, 'users', adminId, 'adminProfile', 'adminProfile'), {
    designation: 'Super Admin',
    permissions: ['manageUsers', 'verifyInstitutions', 'auditLogs', 'assignRoles'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Jobs (two sample)
  const jobsCol = collection(db, 'jobs');
  const job1 = await addDoc(jobsCol, {
    title: 'Software Engineer Intern',
    description: 'Work on scalable backend services.',
    companyId: recruiterId,
    companyName: 'TechCorp Pvt Ltd',
    location: 'Remote',
    type: 'Internship',
    salaryRange: '6-8 LPA',
    skillsRequired: ['Node.js', 'React'],
    postedAt: serverTimestamp(),
    deadline: serverTimestamp(),
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const job2 = await addDoc(jobsCol, {
    title: 'Frontend Engineer',
    description: 'Build delightful UI components.',
    companyId: recruiterId,
    companyName: 'TechCorp Pvt Ltd',
    location: 'Bengaluru',
    type: 'Full-Time',
    salaryRange: '12-15 LPA',
    skillsRequired: ['React', 'CSS', 'Accessibility'],
    postedAt: serverTimestamp(),
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Applications
  const appsCol = collection(db, 'applications');
  await addDoc(appsCol, {
    jobId: job1.id,
    studentId: studentId,
    recruiterId: recruiterId,
    appliedAt: serverTimestamp(),
    status: 'applied',
    resumeURL: 'https://example.com/resume.pdf',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Assessments
  const assessmentsCol = collection(db, 'assessments');
  const assessmentRef = await addDoc(assessmentsCol, {
    title: 'JavaScript Basics',
    description: 'MCQ test on JS fundamentals',
    createdBy: adminId,
    duration: 30,
    questions: [
      { question: 'What is closure?', options: ['Block', 'Scope chain + function', 'Loop', 'Object'], correctOption: 1 }
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Assessment result
  await addDoc(collection(db, 'users', studentId, 'assessmentResults'), {
    assessmentId: assessmentRef.id,
    score: 85,
    total: 100,
    attemptedAt: serverTimestamp(),
    timeTaken: 25,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Verification
  await addDoc(collection(db, 'verifications'), {
    userId: studentId,
    type: 'certificate',
    status: 'pending',
    remarks: 'Awaiting document review',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Notification
  await addDoc(collection(db, 'users', studentId, 'notifications'), {
    title: 'Interview Scheduled',
    message: 'Interview with TechCorp will be announced soon.',
    type: 'job',
    createdAt: serverTimestamp(),
    read: false,
  });

  // Message
  await addDoc(collection(db, 'messages'), {
    senderId: recruiterId,
    receiverId: studentId,
    content: 'We would like to schedule an interview.',
    sentAt: serverTimestamp(),
    read: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Institution
  await addDoc(collection(db, 'institutions'), {
    name: 'IIT Madras',
    location: 'Chennai',
    domain: 'iitm.ac.in',
    status: 'approved',
    verifiedBy: adminId,
    verifiedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Analytics metric
  await setDoc(doc(db, 'analytics', 'jobStats'), {
    type: 'jobStats',
    totalJobs: 2,
    totalApplications: 1,
    avgApplicationsPerJob: 0.5,
    lastUpdated: serverTimestamp(),
  });

  console.log('--- HireLedger Firestore Seed Complete ---');
}

// Execute if run directly (Node ESM)
seed().catch(e => {
  console.error('Seed failed', e);
  process.exit(1);
});
