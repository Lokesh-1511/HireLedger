import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/pages/StudentJobs.css';
import { useStudentData } from '../context/StudentDataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const TABS = [
  { key: 'all', label: 'All roles' },
  { key: 'applied', label: 'Active applications' },
  { key: 'shortlisted', label: 'In review' },
  { key: 'archived', label: 'Archived' }
];

function StatusBadge({ stage, status, saved }) {
  const fallback = saved ? 'Saved' : status;
  const label = stage || (fallback
    ? fallback.charAt(0).toUpperCase() + fallback.slice(1)
    : null);
  if (!label) return null;
  const colorMap = {
    Applied: 'var(--accent-500)',
    Screen: '#6366f1',
    Interview: '#f59e0b',
    Offer: '#16a34a',
    Rejected: '#dc2626',
    Withdrawn: '#6b7280',
    Archived: '#64748b',
    Saved: '#0ea5e9'
  };
  const color = colorMap[label] || 'var(--accent-500)';
  return <span className="job-status-badge" style={{ '--badge-color': color }}>{label}</span>;
}

function Dropdown({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="dropdown" ref={ref}>
      <button
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        ⋯
      </button>
      {open && (
        <ul className="menu" role="menu">
          {items.map(item => (
            <li key={item.key} role="none">
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                }}
                disabled={item.disabled}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StageStepper({ stages, currentIndex }) {
  if (currentIndex == null) return null;
  return (
    <div className="job-stage-track" role="group" aria-label="Application progress">
      {stages.map((stage, index) => (
        <span
          key={stage}
          className={`stage-node${index <= currentIndex ? ' stage-node-active' : ''}`}
          aria-current={index === currentIndex ? 'step' : undefined}
        >
          <span className="stage-node-dot" aria-hidden />
          <span className="stage-node-label">{stage}</span>
        </span>
      ))}
    </div>
  );
}

function deriveCompany(job) {
  const name = job?.company || job?.companyName || '';
  return name;
}
function companyInitial(job) {
  const name = deriveCompany(job);
  return name ? name.charAt(0).toUpperCase() : '?';
}

function JobDetailsModal({ job, stageIndex, stages, onClose }) {
  useEffect(() => {
    if (!job) return;
    function handleKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [job, onClose]);

  if (!job) return null;

  return (
    <div className="job-modal-backdrop" role="dialog" aria-modal="true" aria-label={`${job.title} details`}>
      <div className="job-modal">
        <header className="job-modal-header">
          <div className="job-modal-title">
            <div className="job-modal-logo" aria-hidden>{job.logo || companyInitial(job)}</div>
            <div>
              <h2>{job.title}</h2>
              <p className="muted">{deriveCompany(job) || 'Company'} · {job.location || '—'}</p>
            </div>
          </div>
          <button type="button" className="job-modal-close" onClick={onClose} aria-label="Close details">✕</button>
        </header>
        <section className="job-modal-body">
          {job.description && <p className="job-modal-description">{job.description}</p>}
          <div className="job-modal-tags">
            {job.tags?.map(tag => <span key={tag} className="tag-lite">{tag}</span>)}
          </div>
          {stageIndex != null && (
            <div className="job-modal-stage">
              <h3 className="job-modal-subheading">Application progress</h3>
              <StageStepper stages={stages} currentIndex={stageIndex} />
            </div>
          )}
        </section>
        <footer className="job-modal-footer">
          <span className="muted fs-xs">{job.posted ? `Posted ${job.posted} ago` : ''} {job.type ? `· ${job.type}` : ''}</span>
        </footer>
      </div>
    </div>
  );
}

export default function StudentJobs() {
  const {
    jobs,
    applications,
    filters,
    setFilters,
    applyToJob,
    withdrawApplication,
    toggleSavedJob,
    setJobStatus,
    applicationStages
  } = useStudentData();
  const { push } = useToast();
  const [selectedJobId, setSelectedJobId] = useState(null);

  const applicationByJob = useMemo(() => {
    const map = new Map();
    applications.forEach(app => {
      map.set(app.jobId, app);
    });
    return map;
  }, [applications]);

  const availableTags = useMemo(() => {
    const tags = new Set();
    jobs.forEach(job => {
      job.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const f = filters || { query:'', tags:[], tab:'all' };
    const normalizedQuery = (f.query || '').trim().toLowerCase();
    return jobs.filter(job => {
      const application = applicationByJob.get(job.id);
      const isArchived = job.status === 'rejected' || job.status === 'withdrawn';

      if (f.tab === 'archived' && !isArchived) return false;
      if (f.tab !== 'archived' && isArchived) return false;
      if (f.tab === 'applied' && !application) return false;
      if (f.tab === 'shortlisted') {
        if (!application) return false;
        const idx = applicationStages.indexOf(application.status);
        if (idx < 1) return false;
      }

      if (normalizedQuery) {
        const haystack = `${job.title || ''} ${job.company || job.companyName || ''}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      if (Array.isArray(f.tags) && f.tags.length) {
        const hasAll = f.tags.every(tag => job.tags?.includes(tag));
        if (!hasAll) return false;
      }
      return true;
    });
  }, [jobs, filters, applicationByJob]);

  const selectedJob = useMemo(() => jobs.find(job => job.id === selectedJobId) || null, [jobs, selectedJobId]);
  const selectedStageIndex = selectedJob ? (() => {
    const app = applicationByJob.get(selectedJob.id);
    if (!app) return null;
    const status = app.status; // Firestore status string
    const idx = applicationStages.indexOf(status);
    return idx === -1 ? null : idx;
  })() : null;

  function handleResetFilters() {
    setFilters({ query: '', tags: [], tab: 'all' });
  }

  function handlePrimary(job) {
    const application = applicationByJob.get(job.id);
    if (!application) {
      applyToJob(job.id);
      push(`Application started for ${job.title}.`, { type: 'success' });
      return;
    }
    const currentIdx = applicationStages.indexOf(application.status);
    if (currentIdx === -1 || currentIdx >= applicationStages.length - 1) {
      push(`You're already at the ${application.status} stage for ${job.title}.`, { type: 'info' });
      return;
    }
    // We'll pass applicationId instead of jobId now (context was updated accordingly)
  // Students can no longer advance their own stage; just inform current status.
  push(`Current stage: ${application.status} for ${job.title}. Recruiter will update further stages.`, { type: 'info' });
  }

  function handleWithdraw(job) {
    const application = applicationByJob.get(job.id);
    if (!application) return;
    withdrawApplication(application.id);
    push(`Application withdrawn for ${job.title}.`, { type: 'warning' });
  }

  function handleReject(job) {
    const application = applicationByJob.get(job.id);
    if (application) withdrawApplication(application.id);
    setJobStatus(job.id, 'rejected');
    push(`${job.title} moved to archived.`, { type: 'info' });
  }

  function handleSave(job) {
    const wasSaved = job.saved;
    toggleSavedJob(job.id);
    push(wasSaved ? `Removed ${job.title} from saved.` : `Saved ${job.title} for later.`, { type: wasSaved ? 'info' : 'success' });
  }

  const dropdownItemsForJob = job => {
    const application = applicationByJob.get(job.id);
    const items = [
      { key: 'details', label: 'View details', onSelect: () => setSelectedJobId(job.id) },
      { key: 'save', label: job.saved ? 'Remove from saved' : 'Save for later', onSelect: () => handleSave(job) }
    ];
    if (application) {
      items.push(
        { key: 'withdraw', label: 'Withdraw application', onSelect: () => handleWithdraw(job) },
        { key: 'reject', label: 'Mark as rejected', onSelect: () => handleReject(job) }
      );
    } else if (job.status === 'withdrawn') {
      items.push({ key: 'reapply', label: 'Reapply', onSelect: () => handlePrimary(job) });
    }
    return items;
  };

  return (
    <div className="jobs-page">
      <div className="jobs-header" role="search">
        <div className="search-row">
          <input
            type="text"
            placeholder="Search jobs or companies..."
            value={filters.query}
            onChange={e => setFilters({ query: e.target.value })}
            aria-label="Search jobs"
          />
        </div>
        <div className="filter-chips" aria-label="Filter skills">
          {availableTags.map(tag => {
            const active = filters.tags.includes(tag);
            return (
              <button
                key={tag}
                className={`chip${active ? ' chip-active' : ''}`}
                aria-pressed={active}
                onClick={() => {
                  const tags = active ? filters.tags.filter(t => t !== tag) : [...filters.tags, tag];
                  setFilters({ tags });
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <div className="tabs" role="tablist" aria-label="Application status filters">
          {TABS.map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={filters.tab === tab.key}
              className={`tab${filters.tab === tab.key ? ' tab-active' : ''}`}
              onClick={() => setFilters({ tab: tab.key })}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="jobs-results" aria-live="polite">
        {filteredJobs.length === 0 && (
          <div className="empty-state">
            <p>No jobs match your current filters.</p>
            <button onClick={handleResetFilters}>Reset filters</button>
          </div>
        )}
        <ul className="job-grid" role="list">
          {filteredJobs.map(job => {
            const application = applicationByJob.get(job.id);
            const stageLabel = application ? application.status : (job.status === 'withdrawn' ? 'withdrawn' : null);
            const isRejected = job.status === 'rejected';
            const isWithdrawn = job.status === 'withdrawn';
            const currentIdx = application ? applicationStages.indexOf(application.status) : -1;
            const primaryLabel = application
              ? (currentIdx >= applicationStages.length - 1 ? 'View status' : 'Advance stage')
              : isWithdrawn ? 'Reapply'
              : isRejected ? 'Archived'
              : 'Apply now';
            return (
              <li key={job.id} className="job-card" role="article" aria-label={job.title}>
                <div className="job-card-head">
                  <div className="job-card-meta">
                    <h3 className="job-title">{job.title}</h3>
                    <p className="job-meta">{deriveCompany(job) || 'Company'} · {job.location || '—'} · {job.type || '—'}</p>
                  </div>
                  <div className="job-card-status">
                    <StatusBadge stage={stageLabel} status={job.status} saved={job.saved} />
                    {job.saved && <span className="saved-flag" aria-hidden>★</span>}
                  </div>
                </div>
                <p className="job-desc">{job.description}</p>
                <div className="job-tags">
                  {job.tags?.map(t => <span key={t} className="tag-lite">{t}</span>)}
                </div>
                {application && (
                  <StageStepper stages={applicationStages} currentIndex={applicationStages.indexOf(application.status)} />
                )}
                <div className="job-actions">
                  <button className="btn-primary" onClick={() => handlePrimary(job)} disabled={isRejected && !application} aria-disabled={isRejected && !application}>
                    {primaryLabel}
                  </button>
                  <Dropdown items={dropdownItemsForJob(job)} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <JobDetailsModal
        job={selectedJob}
        stageIndex={selectedStageIndex}
        stages={applicationStages}
        onClose={() => setSelectedJobId(null)}
      />
    </div>
  );
}
