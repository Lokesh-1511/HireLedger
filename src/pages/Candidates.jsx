import React, { useMemo } from 'react';
import { useRecruiterData } from '../context/RecruiterDataContext.jsx';
import { useAdminData } from '../context/AdminDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

export default function Candidates() {
  const { user } = useAuth();
  const recruiterCtx = user?.role === 'recruiter' ? useRecruiterData() : null;
  const adminCtx = user?.role === 'admin' ? useAdminData() : null;
  const loading = recruiterCtx?.loading || adminCtx?.loading;
  const applications = recruiterCtx?.applicants || adminCtx?.applications || [];
  const jobs = recruiterCtx?.jobs || adminCtx?.jobs || [];
  const applicantProfiles = recruiterCtx?.applicantProfiles || {}; // only recruiter context enriches; admin fallback dynamic fetch

  // Build a map of jobId -> title for quick lookup
  const jobMap = useMemo(() => {
    const m = new Map();
    jobs.forEach(j => m.set(j.id, j.title || 'Untitled'));
    return m;
  }, [jobs]);

  const rows = useMemo(() => applications.map(a => {
    const profileEntry = applicantProfiles[a.studentId];
    return {
      id: a.id,
      studentId: a.studentId,
      jobTitle: jobMap.get(a.jobId) || 'Job',
      status: a.status,
      studentName: profileEntry?.user?.displayName || a.studentId,
      cgpa: profileEntry?.profile?.cgpa,
      skills: profileEntry?.profile?.skills || []
    };
  }), [applications, applicantProfiles, jobMap]);

  return (
    <div className="surface">
      <h1>Candidates</h1>
      <p className="muted">Search, filter & review applicants.</p>
      {loading && <div className="muted">Loading candidates...</div>}
      {!loading && rows.length === 0 && <div className="muted">No applications found.</div>}
      {!loading && rows.length > 0 && (
        <div className="grid cols-2 candidate-grid">
          {rows.map(r => (
            <div key={r.id} className="surface candidate-card">
              <strong>{r.studentName}</strong>
              <p className="candidate-status">Status: {r.status}</p>
              <p className="small">Job: {r.jobTitle}</p>
              {r.cgpa && <p className="small">CGPA: {r.cgpa}</p>}
              {r.skills?.length > 0 && <p className="small">Skills: {r.skills.slice(0,5).join(', ')}</p>}
              <button className="primary open-profile" disabled>Open Profile</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
