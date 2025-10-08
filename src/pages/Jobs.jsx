import React, { useMemo } from 'react';
import { useRecruiterData } from '../context/RecruiterDataContext.jsx';
import { useAdminData } from '../context/AdminDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Jobs() {
  const { user } = useAuth();
  const recruiterCtx = user?.role === 'recruiter' ? useRecruiterData() : null;
  const adminCtx = user?.role === 'admin' ? useAdminData() : null;
  const loading = recruiterCtx?.loading || adminCtx?.loading;
  const jobs = recruiterCtx?.jobs || adminCtx?.jobs || [];

  const sorted = useMemo(() => jobs.slice().sort((a,b) => {
    const at = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
    const bt = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
    return bt - at; // newest first
  }), [jobs]);

  return (
    <div className="surface">
      <h1>Jobs</h1>
      <p className="muted">Manage job postings and campus drives.</p>
      {loading && <div className="muted">Loading jobs...</div>}
      {!loading && sorted.length === 0 && <div className="muted">No jobs found.</div>}
      {!loading && sorted.length > 0 && (
        <ul className="job-list">
          {sorted.map(j => (
            <li key={j.id} className="job-item">
              <strong>{j.title || 'Untitled'}</strong> <span className="muted">({j.status || 'draft'})</span><br />
              <span className="small">{j.companyName || 'Company'} • {j.location || 'Location'} • {(j.skillsRequired||[]).slice(0,5).join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
