import React, { createContext, useCallback, useContext, useMemo } from 'react';
import usePersistentState from '../hooks/usePersistentState.js';
import { normalizeJob, mapLegacyApplicantStatus, mapLegacyVerificationStatus, JOB_STATUS } from '../utils/schemaConstants.js';

// Provide a simple UUID fallback if uuid package not installed
function ensureId() { return 'rid-' + Math.random().toString(36).slice(2); }

const STORAGE_KEY = 'hl_recruiter_portal_v1';

// Seed applicants (mirrors existing mock with added gender + job link)
const seedApplicants = Array.from({ length: 24 }).map((_, i) => {
  const legacyStatus = ['Screening','Interview','Offer','Rejected'][i % 4];
  return {
    id: 'app-' + (i + 1),
    name: 'Applicant ' + (i + 1),
    college: ['Stanford','MIT','IIT Delhi','CMU','UCLA'][i % 5],
    location: ['NY','SF','Remote','Austin','Seattle'][i % 5],
    skills: ['React','SQL','Node','Python','Figma'].slice(0, (i % 5) + 1),
    // canonical application status mapping
    status: mapLegacyApplicantStatus(legacyStatus),
    legacyStatus,
    jobId: ['job-frontend','job-data','job-mobile','job-fullstack'][i % 4],
    gender: ['Women','Men','Non-binary','Men','Women'][i % 5],
    appliedAt: Date.now() - (i * 86400000),
    createdAt: Date.now() - (i * 86400000)
  };
});

const legacyJobSeed = [
  { id: 'job-frontend', title: 'Frontend Intern', department: 'Engineering', type: 'Internship', mode: 'Remote', location: 'Remote', salaryMin: '20', salaryMax: '28', currency: 'USD', description: 'Work on UI components.', requirements: 'HTML/CSS/JS basics', skills: ['React','CSS'], status: 'open', createdAt: Date.now() - 86400000 * 12 },
  { id: 'job-data', title: 'Data Analyst', department: 'Data', type: 'Full-time', mode: 'Hybrid', location: 'NY', salaryMin: '75000', salaryMax: '90000', currency: 'USD', description: 'Analytics & dashboards.', requirements: 'SQL proficiency', skills: ['SQL','Python'], status: 'open', createdAt: Date.now() - 86400000 * 9 },
  { id: 'job-mobile', title: 'Mobile Developer', department: 'Engineering', type: 'Full-time', mode: 'Hybrid', location: 'Austin', salaryMin: '85000', salaryMax: '105000', currency: 'USD', description: 'Cross-platform features.', requirements: 'React Native/Flutter', skills: ['React','Node'], status: 'open', createdAt: Date.now() - 86400000 * 20 },
  { id: 'job-fullstack', title: 'Full Stack Engineer', department: 'Engineering', type: 'Full-time', mode: 'Remote', location: 'Remote', salaryMin: '95000', salaryMax: '130000', currency: 'USD', description: 'End-to-end product dev.', requirements: 'React + Node', skills: ['React','Node','SQL'], status: 'open', createdAt: Date.now() - 86400000 * 30 }
];
const seedJobs = legacyJobSeed.map(normalizeJob);

const seedInterviews = [
  { id: 'iv-1', title: 'Frontend Screen', candidate: 'Applicant 5', applicantId: 'app-5', jobId: 'job-frontend', day: 2, start: '10:00', end: '10:45' },
  { id: 'iv-2', title: 'Data Round', candidate: 'Applicant 11', applicantId: 'app-11', jobId: 'job-data', day: 3, start: '14:00', end: '15:00' },
  { id: 'iv-3', title: 'HR Intro', candidate: 'Applicant 2', applicantId: 'app-2', jobId: 'job-frontend', day: 4, start: '09:30', end: '10:00' }
];

const seedVerifications = [
  { id: 'ver-1', userId: 'app-5', artifactTitle: 'SQL Mastery', status: mapLegacyVerificationStatus('On-chain'), hash: '0xabc...13f', type: 'certificate' },
  { id: 'ver-2', userId: 'app-11', artifactTitle: 'DSA Badge', status: mapLegacyVerificationStatus('Pending'), hash: null, type: 'certificate' },
  { id: 'ver-3', userId: 'app-2', artifactTitle: 'Frontend Cert', status: mapLegacyVerificationStatus('On-chain'), hash: '0x98e...aa2', type: 'certificate' },
  { id: 'ver-4', userId: 'app-9', artifactTitle: 'Security Fundamentals', status: mapLegacyVerificationStatus('Failed'), hash: null, type: 'certificate' }
];

const seedMessages = [];

const seedState = {
  jobs: seedJobs,
  applicants: seedApplicants,
  interviews: seedInterviews,
  verifications: seedVerifications,
  messages: seedMessages
};

const RecruiterDataContext = createContext(null);

export function RecruiterDataProvider({ children }) {
  const [state, setState, reset] = usePersistentState(STORAGE_KEY, seedState, { throttleMs: 250 });

  // Actions
  const addJob = useCallback((jobDraft) => {
    const legacy = { id: ensureId(), status: JOB_STATUS.DRAFT, createdAt: Date.now(), ...jobDraft };
    const normalized = normalizeJob(legacy);
    setState(prev => ({
      ...prev,
      jobs: [ normalized, ...prev.jobs ]
    }));
  }, [setState]);

  const updateApplicantStatus = useCallback((applicantId, status) => {
    setState(prev => ({
      ...prev,
      applicants: prev.applicants.map(a => a.id === applicantId ? { ...a, status } : a)
    }));
  }, [setState]);

  const bulkMessage = useCallback((applicantIds, htmlBody) => {
    setState(prev => ({
      ...prev,
      messages: [{ id: ensureId(), createdAt: Date.now(), applicantIds, body: htmlBody }, ...prev.messages ].slice(0, 50)
    }));
  }, [setState]);

  const scheduleInterview = useCallback((slot) => {
    setState(prev => ({
      ...prev,
      interviews: [...prev.interviews, { id: ensureId(), ...slot }]
    }));
  }, [setState]);

  const updateInterview = useCallback((id, patch) => {
    setState(prev => ({
      ...prev,
      interviews: prev.interviews.map(i => i.id === id ? { ...i, ...patch } : i)
    }));
  }, [setState]);

  const requestVerification = useCallback((applicantId, credential) => {
    setState(prev => ({
      ...prev,
      verifications: [
        { id: ensureId(), applicantId, credential, status: 'Pending', hash: null },
        ...prev.verifications
      ]
    }));
  }, [setState]);

  const markVerification = useCallback((verificationId, hash) => {
    setState(prev => ({
      ...prev,
      verifications: prev.verifications.map(v => v.id === verificationId ? { ...v, status: 'On-chain', hash } : v)
    }));
  }, [setState]);

  // Selectors / derived metrics
  const metrics = useMemo(() => {
    const activeJobs = state.jobs.filter(j => j.status === 'open' || j.status === 'draft').length;
    const applicants = state.applicants.length;
    const offers = state.applicants.filter(a => a.status === 'Offer' || a.status === 'Hired').length;
    const interviewRate = applicants ? Math.round((state.interviews.length / applicants) * 100) : 0;
    return { activeJobs, applicants, offers, interviewRate };
  }, [state.jobs, state.applicants, state.interviews]);

  const applicationsPerJob = useMemo(() => {
    const map = new Map();
    state.applicants.forEach(a => { map.set(a.jobId, (map.get(a.jobId) || 0) + 1); });
    return state.jobs.map(j => ({ job: j.title, jobId: j.id, applications: map.get(j.id) || 0 }));
  }, [state.jobs, state.applicants]);

  const diversityBreakdown = useMemo(() => {
    const counts = new Map();
    state.applicants.forEach(a => counts.set(a.gender, (counts.get(a.gender) || 0) + 1));
    const total = state.applicants.length || 1;
    return Array.from(counts.entries()).map(([label, count]) => ({ label, value: Math.round((count/total)*100) }));
  }, [state.applicants]);

  const verifications = state.verifications.map(v => ({
    ...v,
    applicant: state.applicants.find(a => a.id === v.applicantId)?.name || 'Unknown'
  }));

  const value = {
    jobs: state.jobs,
    applicants: state.applicants,
    interviews: state.interviews,
    verifications,
    messages: state.messages,
    metrics,
    applicationsPerJob,
    diversityBreakdown,
    addJob,
    updateApplicantStatus,
    bulkMessage,
    scheduleInterview,
    updateInterview,
    requestVerification,
    markVerification,
    resetRecruiterData: reset
  };

  return <RecruiterDataContext.Provider value={value}>{children}</RecruiterDataContext.Provider>;
}

export function useRecruiterData() {
  const ctx = useContext(RecruiterDataContext);
  if (!ctx) throw new Error('useRecruiterData must be used within RecruiterDataProvider');
  return ctx;
}
