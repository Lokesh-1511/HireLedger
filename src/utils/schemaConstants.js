// Canonical schema constants & mapping helpers

export const ROLES = Object.freeze({ STUDENT:'student', RECRUITER:'recruiter', ADMIN:'admin' });

export const JOB_STATUS = Object.freeze({ ACTIVE:'active', CLOSED:'closed', DRAFT:'draft' });

export const APPLICATION_STATUS = Object.freeze({
  APPLIED:'applied',
  SHORTLISTED:'shortlisted',
  INTERVIEW:'interview',
  OFFER:'offer',
  REJECTED:'rejected',
  WITHDRAWN:'withdrawn'
});

export function mapLegacyJobStatus(status) {
  if (status === 'open') return JOB_STATUS.ACTIVE;
  return JOB_STATUS[status?.toUpperCase()] || JOB_STATUS.DRAFT;
}

export function mapLegacyApplicantStatus(status) {
  switch (status) {
    case 'Screening': return APPLICATION_STATUS.APPLIED;
    case 'Interview': return APPLICATION_STATUS.INTERVIEW;
    case 'Offer': return APPLICATION_STATUS.OFFER;
    case 'Rejected': return APPLICATION_STATUS.REJECTED;
    case 'Hired': return APPLICATION_STATUS.OFFER; // treat hired as offer accepted for now
    default: return APPLICATION_STATUS.APPLIED;
  }
}

export function mapLegacyVerificationStatus(status) {
  switch (status) {
    case 'On-chain': return 'verified';
    case 'Pending': return 'pending';
    case 'Failed': return 'rejected';
    default: return 'pending';
  }
}

// Transform a legacy job object (with salaryMin/Max etc.) to canonical shape
export function normalizeJob(job) {
  if (!job) return job;
  const salaryRange = job.salaryRange || (job.salaryMin && job.salaryMax ? `${job.salaryMin}-${job.salaryMax}` : undefined);
  const postedAt = job.postedAt || job.createdAt || Date.now();
  const status = mapLegacyJobStatus(job.status);
  const skillsRequired = job.skillsRequired || job.skills || [];
  const meta = {
    ...(job.salaryMin ? { salaryMin: job.salaryMin } : {}),
    ...(job.salaryMax ? { salaryMax: job.salaryMax } : {}),
    ...(job.currency ? { currency: job.currency } : {}),
    ...(job.mode ? { mode: job.mode } : {}),
    ...(job.department ? { department: job.department } : {}),
    ...(job.requirements ? { requirements: job.requirements } : {}),
  };
  return {
    id: job.id,
    title: job.title,
    description: job.description || job.roleSummary || '',
    companyId: job.companyId || 'mock-recruiter-uid',
    companyName: job.companyName || 'TechCorp Pvt Ltd',
    location: job.location,
    type: job.type,
    salaryRange: salaryRange || undefined,
    skillsRequired,
    postedAt,
    deadline: job.deadline || undefined,
    status,
    meta: Object.keys(meta).length ? meta : undefined,
  };
}
