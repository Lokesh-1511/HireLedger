import React from 'react';
import '../styles/pages/RecruiterDashboard.css';
import { useRecruiterData } from '../context/RecruiterDataContext.jsx';

/*
  RecruiterDashboard
  ------------------
  KPI overview for recruiter performance.
  TODO(API): Replace static metrics with aggregated backend analytics.
  TODO(ANALYTICS): Track interaction (view filters, date range selection, exports).
*/

export default function RecruiterDashboard() {
  const { metrics, loading, jobs, contextInfo } = useRecruiterData();
  const cards = [
    { key: 'activeJobs', label: 'Active Jobs', value: metrics.activeJobs, delta: '' },
    { key: 'applicants', label: 'Applicants', value: metrics.applicants, delta: '' },
    { key: 'conversion', label: 'Interview Rate', value: metrics.interviewRate + '%', delta: '' },
    { key: 'offers', label: 'Offers / Hires', value: metrics.offers, delta: '' }
  ];
  return (
    <div className="recruiter-dashboard">
      <header className="surface dash-head">
        <h1>Recruiter Dashboard</h1>
        {loading && <p className="muted small">Loading recruiter data…</p>}
        {!loading && jobs.length === 0 && (
          <p className="muted small">
            {contextInfo.mode === 'no-company-field' && 'No company assigned to your user record yet. Add a companyId to users/<uid>.' }
            {contextInfo.mode === 'derived-company' && 'No jobs found for this company yet. Create your first job.'}
            {contextInfo.mode === 'meta-error' && 'Could not load company metadata.'}
            {contextInfo.mode === 'anonymous' && 'Sign in to view recruiter metrics.'}
            {contextInfo.mode === 'no-user-doc' && 'User document missing; ensureUser not called.'}
          </p>
        )}
      </header>
      <section className="recruiter-dashboard-grid" aria-label="Key performance indicators">
        {cards.map(m => (
          <div key={m.key} className="recruiter-kpi-card" role="group" aria-label={m.label}>
            <h3>{m.label}</h3>
            <div className="recruiter-kpi-metric">{m.value}</div>
            {m.delta && <div className="recruiter-kpi-trend">{m.delta}</div>}
          </div>
        ))}
      </section>
      <section className="surface kpi-notes">
        <h2 className="h-sm">Insights (Coming Soon)</h2>
        <ul className="muted list-tight">
          <li>Trend charts for funnel conversion</li>
          <li>Campus performance comparisons</li>
          <li>Time-to-fill velocity metrics</li>
        </ul>
      </section>
    </div>
  );
}
