import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import usePersistentState from '../hooks/usePersistentState.js';

const STORAGE_KEY = 'hl_student_portal_v1';
export const APPLICATION_STAGES = ['Applied', 'Screen', 'Interview', 'Offer'];

const seedJobs = [
  {
    id: 'job-frontend-intern',
    title: 'Frontend Intern',
    company: 'TechNova',
    logo: '🛰️',
    location: 'Remote',
    type: 'Internship',
    salary: '$25/hr',
    tags: ['React', 'UI', 'CSS'],
    posted: '2d',
    status: 'applied',
    saved: false,
    description: 'Help craft accessible UI components and support the design system rollout for our core product.'
  },
  {
    id: 'job-data-analyst',
    title: 'Data Analyst Intern',
    company: 'DataForge',
    logo: '📊',
    location: 'NYC',
    type: 'Internship',
    salary: '$28/hr',
    tags: ['SQL', 'Python', 'ETL'],
    posted: '1d',
    status: 'screen',
    saved: false,
    description: 'Analyze product telemetry, maintain BI dashboards, and prototype quick ETL pipelines with mentorship.'
  },
  {
    id: 'job-devops-trainee',
    title: 'DevOps Trainee',
    company: 'CloudSpan',
    logo: '☁️',
    location: 'Remote',
    type: 'Apprenticeship',
    salary: '$30/hr',
    tags: ['AWS', 'Terraform', 'CI/CD'],
    posted: '3d',
    status: null,
    saved: false,
    description: 'Automate infrastructure workflows, learn observability best practices, and shadow incident response drills.'
  },
  {
    id: 'job-security-research',
    title: 'Security Research Intern',
    company: 'SecureStack',
    logo: '🔐',
    location: 'Austin, TX',
    type: 'Internship',
    salary: '$32/hr',
    tags: ['AppSec', 'OWASP', 'SAST'],
    posted: '5d',
    status: null,
    saved: false,
    description: 'Assist the security research team with threat modeling reviews and automated scanning experiments.'
  },
  {
    id: 'job-ml-intern',
    title: 'Machine Learning Intern',
    company: 'InsightWorks',
    logo: '🤖',
    location: 'Chicago, IL',
    type: 'Internship',
    salary: '$29/hr',
    tags: ['Python', 'Pandas', 'ML'],
    posted: '4d',
    status: null,
    saved: false,
    description: 'Build data cleaning scripts, evaluate baseline models, and partner with product to translate insights.'
  },
  {
    id: 'job-product-ops',
    title: 'Product Operations Associate',
    company: 'Brightwave',
    logo: '💡',
    location: 'Remote',
    type: 'Full-time',
    salary: '$68k',
    tags: ['Ops', 'Analytics', 'CX'],
    posted: '6d',
    status: null,
    saved: false,
    description: 'Coordinate product releases, measure experiment outcomes, and streamline feedback loops with stakeholders.'
  }
];

const seedState = {
  jobs: seedJobs,
  applications: [
    { id: 'app-frontend', jobId: 'job-frontend-intern', stageIndex: 2, updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2 },
    { id: 'app-data', jobId: 'job-data-analyst', stageIndex: 1, updatedAt: Date.now() - 1000 * 60 * 60 * 12 }
  ],
  interviews: [
    { id: 'iv-frontend', jobId: 'job-frontend-intern', scheduledAt: '2025-10-14T14:00:00-04:00', type: 'Technical', medium: 'Zoom' },
    { id: 'iv-security', jobId: 'job-security-research', scheduledAt: '2025-10-18T14:30:00-04:00', type: 'Behavioral', medium: 'Google Meet' }
  ],
  skills: [
    { id: 'skill-react', name: 'React', level: 4, goal: 5 },
    { id: 'skill-python', name: 'Python', level: 3, goal: 5 },
    { id: 'skill-sql', name: 'SQL', level: 3, goal: 5 },
    { id: 'skill-aws', name: 'AWS', level: 2, goal: 4 }
  ],
  notifications: [
    { id: 'notif-1', type: 'app', text: 'Your application for Frontend Intern moved to Interview stage.', read: false, createdAt: Date.now() - 1000 * 60 * 60 * 2 },
    { id: 'notif-2', type: 'reminder', text: 'Upcoming interview with TechNova in 3 days.', read: false, createdAt: Date.now() - 1000 * 60 * 60 * 24 },
    { id: 'notif-3', type: 'tip', text: 'Add more project details to improve profile strength.', read: false, createdAt: Date.now() - 1000 * 60 * 60 * 26 },
    { id: 'notif-4', type: 'job', text: 'New role: AI Research Intern at DataForge.', read: false, createdAt: Date.now() - 1000 * 60 * 60 * 6 },
    { id: 'notif-5', type: 'skill', text: 'Trending skill: Rust is gaining demand.', read: false, createdAt: Date.now() - 1000 * 60 * 60 * 12 }
  ],
  preferences: {
    filters: { query: '', tags: [], tab: 'all' }
  }
};

const StudentDataContext = createContext(null);

function computeProfileCompletion(snapshot) {
  if (!snapshot) return 0;
  const sections = [
    () => snapshot.personal && snapshot.personal.firstName && snapshot.personal.lastName && snapshot.personal.email,
    () => Array.isArray(snapshot.education) && snapshot.education.length > 0 && snapshot.education[0].school && snapshot.education[0].degree,
    () => snapshot.skills && Array.isArray(snapshot.skills.core) && snapshot.skills.core.length > 0,
    () => Array.isArray(snapshot.projects) && snapshot.projects.length > 0 && snapshot.projects[0].name && snapshot.projects[0].description,
    () => snapshot.resume && snapshot.resume.file,
    () => Array.isArray(snapshot.certificates) && snapshot.certificates.length > 0
  ];
  const completed = sections.reduce((acc, fn) => acc + (fn() ? 1 : 0), 0);
  return Math.round((completed / sections.length) * 100);
}

function readProfileSnapshot() {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem('hl_profile_builder_v1');
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return computeProfileCompletion(parsed);
  } catch {
    return 0;
  }
}

function nextStageIndex(currentIndex) {
  return Math.min(currentIndex + 1, APPLICATION_STAGES.length - 1);
}

function clampLevel(level) {
  return Math.max(0, Math.min(5, Math.round(level)));
}

function pushNotification(notifications, payload) {
  const next = [{ id: `notif-${Date.now()}`, read: false, createdAt: Date.now(), ...payload }, ...notifications];
  return next.slice(0, 20);
}

export function StudentDataProvider({ children }) {
  const [state, setState, resetState] = usePersistentState(STORAGE_KEY, seedState, { throttleMs: 300 });
  const resetStudentData = useCallback(() => {
    resetState();
  }, [resetState]);
  const [profileCompletion, setProfileCompletion] = useState(() => readProfileSnapshot());
  const refreshProfileCompletion = useCallback(() => {
    setProfileCompletion(readProfileSnapshot());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    function onStorage(event) {
      if (event.key === 'hl_profile_builder_v1') {
        refreshProfileCompletion();
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshProfileCompletion]);

  const jobMap = useMemo(() => {
    return new Map(state.jobs.map(job => [job.id, job]));
  }, [state.jobs]);

  const applications = useMemo(() => {
    return state.applications.map(app => {
      const job = jobMap.get(app.jobId);
      return {
        ...app,
        job,
        stage: APPLICATION_STAGES[app.stageIndex] || APPLICATION_STAGES[0]
      };
    }).filter(app => app.job);
  }, [state.applications, jobMap]);

  const interviews = useMemo(() => {
    return state.interviews.map(iv => ({
      ...iv,
      job: jobMap.get(iv.jobId)
    })).filter(iv => iv.job);
  }, [state.interviews, jobMap]);

  const applyToJob = useCallback((jobId) => {
    setState(prev => {
      const job = prev.jobs.find(j => j.id === jobId);
      if (!job) return prev;
      const jobs = prev.jobs.map(j => j.id === jobId ? { ...j, status: 'applied', saved: false, updatedAt: Date.now() } : j);
      const hasApplication = prev.applications.some(app => app.jobId === jobId);
      const applications = hasApplication ? prev.applications : [
        ...prev.applications,
        { id: `app-${jobId}`, jobId, stageIndex: 0, updatedAt: Date.now() }
      ];
      const notifications = pushNotification(prev.notifications, { type: 'app', text: `Application started for ${job.title}.` });
      return { ...prev, jobs, applications, notifications };
    });
  }, [setState]);

  const setJobStatus = useCallback((jobId, status) => {
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.map(job => job.id === jobId ? { ...job, status, updatedAt: Date.now() } : job)
    }));
  }, [setState]);

  const toggleSavedJob = useCallback((jobId) => {
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.map(job => job.id === jobId ? { ...job, saved: !job.saved, updatedAt: Date.now() } : job)
    }));
  }, [setState]);

  const setApplicationStage = useCallback((jobId, stageIndex) => {
    setState(prev => {
      const idx = prev.applications.findIndex(app => app.jobId === jobId);
      if (idx === -1) return prev;
      const applications = prev.applications.map(app => app.jobId === jobId ? { ...app, stageIndex, updatedAt: Date.now() } : app);
      const job = prev.jobs.find(j => j.id === jobId);
      const stageStatus = APPLICATION_STAGES[stageIndex]?.toLowerCase();
      const jobs = stageStatus ? prev.jobs.map(j => j.id === jobId ? { ...j, status: stageStatus, updatedAt: Date.now() } : j) : prev.jobs;
      const notifications = stageIndex > prev.applications[idx].stageIndex
        ? pushNotification(prev.notifications, { type: 'app', text: `Application for ${job?.title || 'job'} moved to ${APPLICATION_STAGES[stageIndex]}.` })
        : prev.notifications;
      return { ...prev, applications, notifications, jobs };
    });
  }, [setState]);

  const advanceApplicationStage = useCallback((jobId) => {
    setState(prev => {
      const app = prev.applications.find(a => a.jobId === jobId);
      if (!app) return prev;
      const nextIndex = nextStageIndex(app.stageIndex);
      if (nextIndex === app.stageIndex) return prev;
      const applications = prev.applications.map(a => a.jobId === jobId ? { ...a, stageIndex: nextIndex, updatedAt: Date.now() } : a);
      const job = prev.jobs.find(j => j.id === jobId);
      const notifications = pushNotification(prev.notifications, { type: 'app', text: `Great! ${job?.title || 'Application'} advanced to ${APPLICATION_STAGES[nextIndex]}.` });
      const stageStatus = APPLICATION_STAGES[nextIndex]?.toLowerCase();
      const jobs = stageStatus ? prev.jobs.map(j => j.id === jobId ? { ...j, status: stageStatus, updatedAt: Date.now() } : j) : prev.jobs;
      return { ...prev, applications, notifications, jobs };
    });
  }, [setState]);

  const withdrawApplication = useCallback((jobId) => {
    setState(prev => {
      if (!prev.applications.some(app => app.jobId === jobId)) return prev;
      const applications = prev.applications.filter(app => app.jobId !== jobId);
      const jobs = prev.jobs.map(job => job.id === jobId ? { ...job, status: 'withdrawn', updatedAt: Date.now() } : job);
      const notifications = pushNotification(prev.notifications, { type: 'reminder', text: `You withdrew your application for ${prev.jobs.find(j => j.id === jobId)?.title || 'a role'}.` });
      return { ...prev, applications, jobs, notifications };
    });
  }, [setState]);

  const markNotificationRead = useCallback((id) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  }, [setState]);

  const clearNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }));
  }, [setState]);

  const updateSkillLevel = useCallback((skillId, level) => {
    setState(prev => ({
      ...prev,
      skills: prev.skills.map(skill => skill.id === skillId ? { ...skill, level: clampLevel(level) } : skill)
    }));
  }, [setState]);

  const setFilters = useCallback((filters) => {
    setState(prev => {
      const currentPreferences = prev.preferences ?? { filters: { query: '', tags: [], tab: 'all' } };
      const currentFilters = currentPreferences.filters ?? { query: '', tags: [], tab: 'all' };
      return {
        ...prev,
        preferences: {
          ...currentPreferences,
          filters: { ...currentFilters, ...filters }
        }
      };
    });
  }, [setState]);

  const filters = useMemo(() => {
    const source = state.preferences?.filters ?? {};
    return {
      query: typeof source.query === 'string' ? source.query : '',
      tags: Array.isArray(source.tags) ? source.tags : [],
      tab: typeof source.tab === 'string' ? source.tab : 'all'
    };
  }, [state.preferences]);

  const value = useMemo(() => ({
    jobs: state.jobs,
    applications,
    interviews,
    skills: state.skills,
    notifications: state.notifications,
    filters,
    applyToJob,
    setJobStatus,
    toggleSavedJob,
    setApplicationStage,
    advanceApplicationStage,
    withdrawApplication,
    markNotificationRead,
    clearNotifications,
    updateSkillLevel,
    setFilters,
    refreshProfileCompletion,
    profileCompletion,
    resetStudentData,
    applicationStages: APPLICATION_STAGES
  }), [
    state.jobs,
    applications,
    interviews,
    state.skills,
    state.notifications,
    filters,
    applyToJob,
    setJobStatus,
    toggleSavedJob,
    setApplicationStage,
    advanceApplicationStage,
    withdrawApplication,
    markNotificationRead,
    clearNotifications,
    updateSkillLevel,
    setFilters,
    refreshProfileCompletion,
    profileCompletion,
    resetStudentData
  ]);

  return (
    <StudentDataContext.Provider value={value}>
      {children}
    </StudentDataContext.Provider>
  );
}

export function useStudentData() {
  const ctx = useContext(StudentDataContext);
  if (!ctx) throw new Error('useStudentData must be used inside StudentDataProvider');
  return ctx;
}
